// Test for issue #14151 - importing virtual module with .vue extension
import VirtualComponent from 'virtual:test-virtual-file/Foo.vue'

const text = `Virtual module imported: ${VirtualComponent.name}`
document.querySelector('.virtual-module').textContent = text
