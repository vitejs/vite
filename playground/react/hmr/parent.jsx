import { Foo } from './no-exported-comp'

export default function Parent() {
  console.log('Parent rendered')

  return <div id="parent">{Foo.is}</div>
}
