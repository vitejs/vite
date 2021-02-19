import Tpl from './template.eft'

export default class Link extends Tpl {
	constructor(text, href) {
		super({
			$data: {text, href}
		})
	}
}
