import Application from '#/app';
import config, { enterTestMode } from '#config';

import * as QUnit from 'qunit';
import { setApplication } from '@ember/test-helpers';
import { setup } from 'qunit-dom';
import { start as qunitStart, setupEmberOnerrorValidation } from 'ember-qunit';

export function start() {
  enterTestMode();
  setApplication(Application.create(config.APP));
  setup(QUnit.assert);
  setupEmberOnerrorValidation();
  qunitStart();
}
