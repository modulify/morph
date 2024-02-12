export default (message: string): never => {
  throw new Error(`[@modulify/morph] ${message}`)
}