import * as assert from 'assert';
import Utils from '../../Utils/Utils';

suite('Startup extension tests', () => {
  test('Extension is registered', () => {
    assert(!!Utils.getExtensionInfo());
  });

  test('Extension is active', () => {
    const extension = Utils.getExtensionInfo();
    assert(extension && extension.isActive);
  });
});
