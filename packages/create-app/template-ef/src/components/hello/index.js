import Tpl from './template.eft'

export default class Hello extends Tpl {
	constructor(version) {
		super({
			$data: {version}
		})
	}
}
