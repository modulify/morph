import {
  describe,
  expect,
  test,
} from '@jest/globals'

import MorphEach from '@/MorphEach'
import MorphOne from '@/MorphOne'

const toUpperCase = (value: unknown) => {
  if (typeof value === 'string') {
    return value.toUpperCase()
  }

  throw new Error('value must be a string')
}

describe('Morph', () => {
  test('renames properties', () => {
    const morph = new MorphOne()
      .move('_id', 'id')
      .move('_name', 'name')

    expect(morph.convert({
      _id: 1,
      _name: 'Star Wars. Episode IV: A New Hope',
    })).toEqual({
      id: 1,
      name: 'Star Wars. Episode IV: A New Hope',
    })
  })

  test('throws an error when path is not reachable in the source', () => {
    const morph = new MorphOne()
      .move('_id', 'id')
      .move('_name', 'name')

    expect(() => morph.convert({
      _id: 1,
    })).toThrow('[@modulify/morph] Path _name is not reachable in the source')
  })

  test('uses fallback when path is not reachable', () => {
    const morph = new MorphOne()
      .move('_id', 'id')
      .move('_name', 'name', '%not present%')

    expect(morph.convert({
      _id: 1,
    })).toEqual({
      id: 1,
      name: '%not present%',
    })
  })

  test('doesn\'t use fallback when path is reachable', () => {
    const morph = new MorphOne()
      .move('_id', 'id')
      .move('_name', 'name', '%not present%')

    expect(morph.convert({
      _id: 1,
      _name: 'Star Wars. Episode IV: A New Hope',
    })).toEqual({
      id: 1,
      name: 'Star Wars. Episode IV: A New Hope',
    })
  })

  test.each([
    [() => []],
    [() => ({})],
    [() => 'fallback'],
  ])('uses fallback function as value constructor when path is not reachable', (fallback: () => unknown) => {
    const morph = new MorphOne()
      .move('_id', 'id')
      .move('_name', 'name', fallback)

    expect(morph.convert({
      _id: 1,
    })).toEqual({
      id: 1,
      name: fallback(),
    })
  })

  test('extracts properties from deep paths', () => {
    const morph = new MorphOne<{
      _studio: { name: string };
    }>()
      .move('_studio.name', 'studio')

    expect(morph.convert({
      _studio: { name: 'Lucasfilm Ltd. LLC' },
    })).toEqual({
      studio: 'Lucasfilm Ltd. LLC',
    })
  })

  test('uses callback extractor', () => {
    const morph = new MorphOne<{
      _studio: { name: string };
    }, {
      studio: string;
    }>()
      .extract('studio', source => source._studio.name)

    expect(morph.convert({
      _studio: { name: 'Lucasfilm Ltd. LLC' },
    })).toEqual({
      studio: 'Lucasfilm Ltd. LLC',
    })
  })

  test('uses callback processor', () => {
    const morph = new MorphOne()
      .move('_name', 'name')
      .process('name', toUpperCase)

    expect(morph.convert({
      _name: 'Star Wars. Episode IV: A New Hope',
    })).toEqual({
      name: 'STAR WARS. EPISODE IV: A NEW HOPE',
    })
  })

  test('uses processors\' chain', () => {
    const morph = new MorphOne()
      .move('_name', 'name')
      .process('name', [
        toUpperCase,
        (value: unknown) => '<<' + value + '>>',
      ])

    expect(morph.convert({
      _name: 'Star Wars. Episode IV: A New Hope',
    })).toEqual({
      name: '<<STAR WARS. EPISODE IV: A NEW HOPE>>',
    })
  })

  test('uses nested processors\' chain', () => {
    const morph = new MorphOne()
      .move('_name', 'name')
      .process('name', [
        toUpperCase,
        [
          (value: unknown) => '<' + value + '>',
          (value: unknown) => '<' + value + '>',
        ],
      ])

    expect(morph.convert({
      _name: 'Star Wars. Episode IV: A New Hope',
    })).toEqual({
      name: '<<STAR WARS. EPISODE IV: A NEW HOPE>>',
    })
  })

  test('nested mapping', () => {
    type FilmPayload = {
      _id: number;
      _name: string;
      _studio: { _name: string; };
    }

    type Film = {
      id: number;
      name: string;
      studio: { name: string; };
    }

    const morph = new MorphOne<FilmPayload, Film>()
      .move('_id', 'id')
      .move('_name', 'name')
      .move('_studio', 'studio')
      .process('studio', new MorphOne()
        .move('_name', 'name'))

    expect(morph.convert({
      _id: 1,
      _name: 'Star Wars. Episode IV: A New Hope',
      _studio: { _name: 'Lucasfilm Ltd. LLC' },
    })).toEqual({
      id: 1,
      name: 'Star Wars. Episode IV: A New Hope',
      studio: { name: 'Lucasfilm Ltd. LLC' },
    })
  })

  test('array mapping', () => {
    type FilmPayload = {
      _id: number;
      _name: string;
    }

    type Film = {
      id: number;
      name: string;
    }

    const morph = new MorphEach(
      new MorphOne<FilmPayload, Film>()
        .move('_id', 'id')
        .move('_name', 'name')
    )

    expect(morph.convert([{
      _id: 1,
      _name: 'Star Wars. Episode IV: A New Hope',
    }, {
      _id: 6,
      _name: 'Star Wars. Episode III. Revenge of the Sith',
    }])).toEqual([{
      id: 1,
      name: 'Star Wars. Episode IV: A New Hope',
    }, {
      id: 6,
      name: 'Star Wars. Episode III. Revenge of the Sith',
    }])
  })

  test('nested array mapping', () => {
    const morph = new MorphOne()
      .move('_studio', 'studio')
      .process('studio', new MorphOne()
        .move('_name', 'name'))
      .move('_films', 'films')
      .process('films', new MorphEach(new MorphOne()
        .move('_id', 'id')
        .move('_name', 'name')))

    expect(morph.convert({
      _studio: { _name: 'Lucasfilm Ltd. LLC' },
      _films: [{
        _id: 1,
        _name: 'Star Wars. Episode IV: A New Hope',
      }, {
        _id: 6,
        _name: 'Star Wars. Episode III. Revenge of the Sith',
      }],
    })).toEqual({
      studio: { name: 'Lucasfilm Ltd. LLC' },
      films: [{
        id: 1,
        name: 'Star Wars. Episode IV: A New Hope',
      }, {
        id: 6,
        name: 'Star Wars. Episode III. Revenge of the Sith',
      }],
    })
  })

  test('mapping by setter', () => {
    const date = new Date()
    const morph = new MorphOne<{
      hours: number;
      minutes: number;
    }, Date>()
      .move('hours', 'setHours')
      .move('minutes', 'setMinutes')

    date.setHours(0, 0)

    morph.convert({
      hours: 10,
      minutes: 30,
    }, date)

    expect(date.getHours()).toEqual(10)
    expect(date.getMinutes()).toEqual(30)
  })

  test('custom destination', () => {
    const morph = new MorphOne(() => new Date())
      .move('hours', 'setHours')
      .move('minutes', 'setMinutes')

    const date = morph.convert({
      hours: 10,
      minutes: 30,
    })

    expect(date.getHours()).toEqual(10)
    expect(date.getMinutes()).toEqual(30)
  })

  test('mapping by custom injector', () => {
    const date = new Date()
    const morph = new MorphOne<{
      hours: number;
      minutes: number;
    }, Date>()
      .move('hours', 'setHours')
      .inject('minutes', (destination, value) => {
        if (typeof value === 'number') {
          destination.setMinutes(value)
        }
      })

    date.setHours(0, 0)

    morph.convert({
      hours: 10,
      minutes: 30,
    }, date)

    expect(date.getHours()).toEqual(10)
    expect(date.getMinutes()).toEqual(30)
  })

  test('overrides', () => {
    const morph1 = new MorphOne()
      .move('_id', 'id')
      .move('_name', 'name')

    const morph2 = morph1.override().exclude('name')

    expect(morph1.convert({
      _id: 1,
      _name: 'Star Wars. Episode IV: A New Hope',
    })).toEqual({
      id: 1,
      name: 'Star Wars. Episode IV: A New Hope',
    })

    expect(morph2.convert({
      _id: 1,
    })).toEqual({
      id: 1,
    })
  })
})