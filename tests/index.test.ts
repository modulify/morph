import type {
  Extractor,
  Processor,
} from '../types'

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

    expect(morph.apply({
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

    expect(() => morph.apply({
      _id: 1,
    })).toThrow('[@modulify/morph] Path _name is not reachable in the source')
  })

  test('uses fallback when path is not reachable', () => {
    const morph = new MorphOne()
      .move('_id', 'id')
      .move('_name', 'name', '%not present%')

    expect(morph.apply({
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

    expect(morph.apply({
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

    expect(morph.apply({
      _id: 1,
    })).toEqual({
      id: 1,
      name: fallback(),
    })
  })

  test('extracts properties from deep paths', () => {
    const morph = new MorphOne()
      .move('_studio.name', 'studio')

    expect(morph.apply({
      _studio: { name: 'Lucasfilm Ltd. LLC' },
    })).toEqual({
      studio: 'Lucasfilm Ltd. LLC',
    })
  })

  test('uses callback extractor', () => {
    type FilmPayload = {
      _studio: {
        name: string;
      };
    }

    const morph = new MorphOne()
      .extract('studio', ((source: FilmPayload) => source._studio.name) as Extractor)

    expect(morph.apply({
      _studio: { name: 'Lucasfilm Ltd. LLC' },
    })).toEqual({
      studio: 'Lucasfilm Ltd. LLC',
    })
  })

  test('uses callback processor', () => {
    const morph = new MorphOne()
      .move('_name', 'name')
      .process('name', toUpperCase as Processor)

    expect(morph.apply({
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
      ] as Processor[])

    expect(morph.apply({
      _name: 'Star Wars. Episode IV: A New Hope',
    })).toEqual({
      name: '<<STAR WARS. EPISODE IV: A NEW HOPE>>',
    })
  })

  test('uses nested processors\' chain', () => {
    const morph = new MorphOne()
      .move('_name', 'name')
      .process('name', [
        toUpperCase as Processor,
        [
          ((value: unknown) => '<' + value + '>') as Processor,
          ((value: unknown) => '<' + value + '>') as Processor,
        ],
      ])

    expect(morph.apply({
      _name: 'Star Wars. Episode IV: A New Hope',
    })).toEqual({
      name: '<<STAR WARS. EPISODE IV: A NEW HOPE>>',
    })
  })

  test('nested mapping', () => {
    const morph = new MorphOne()
      .move('_studio', 'studio')
      .process('studio', new MorphOne()
        .move('_name', 'name'))

    expect(morph.apply({
      _id: 1,
      _name: 'Star Wars. Episode IV: A New Hope',
      _studio: { _name: 'Lucasfilm Ltd. LLC' },
    })).toEqual({
      studio: { name: 'Lucasfilm Ltd. LLC' },
    })
  })

  test('array mapping', () => {
    const morph = new MorphEach(
      new MorphOne()
        .move('_id', 'id')
        .move('_name', 'name')
    )

    expect(morph.apply([{
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
      .process('films', ((value: unknown[]) => new MorphEach(new MorphOne()
        .move('_id', 'id')
        .move('_name', 'name'))
        .apply(value)
      ) as Processor)

    expect(morph.apply({
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
    const morph = new MorphOne()
      .move('hours', 'setHours')
      .move('minutes', 'setMinutes')

    date.setHours(0, 0)

    morph.apply({
      hours: 10,
      minutes: 30,
    }, date)

    expect(date.getHours()).toEqual(10)
    expect(date.getMinutes()).toEqual(30)
  })

  test('mapping by custom injector', () => {
    const date = new Date()
    const morph = new MorphOne()
      .move('hours', 'setHours')
      .move('minutes', 'minutes')
      .inject('minutes', (destination: unknown, _: string, value: unknown) => {
        if (destination instanceof Date && typeof value === 'number') {
          destination.setMinutes(value)
        }
      })

    date.setHours(0, 0)

    morph.apply({
      hours: 10,
      minutes: 30,
    }, date)

    expect(date.getHours()).toEqual(10)
    expect(date.getMinutes()).toEqual(30)
  })
})