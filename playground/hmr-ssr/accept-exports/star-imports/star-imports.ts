import * as all from './deps-all-accepted'
import * as some from './deps-some-accepted'

log('loaded:all:' + all.a + all.b + all.c + all.default)
log('loaded:some:' + some.a + some.b + some.c + some.default)
log('>>> ready <<<')
