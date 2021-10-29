import { VNode } from 'vue'
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class TestDecorator extends Vue {
  render(): VNode {
    return <div>Decorator works!</div>
  }
}
