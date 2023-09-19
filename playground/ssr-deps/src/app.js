import path from 'node:path'
import readFileContent from '@vitejs/test-read-file-content'
import primitiveExport from '@vitejs/test-primitive-export'
import tsDefaultExport, {
  hello as tsNamedExport,
} from '@vitejs/test-ts-transpiled-exports'
import objectAssignedExports from '@vitejs/test-object-assigned-exports'
import forwardedExport from '@vitejs/test-forwarded-export'
import bcrypt from 'bcrypt'
import definePropertiesExports from '@vitejs/test-define-properties-exports'
import definePropertyExports from '@vitejs/test-define-property-exports'
import onlyObjectAssignedExports from '@vitejs/test-only-object-assigned-exports'
import requireAbsolute from '@vitejs/test-require-absolute'
import noExternalCjs from '@vitejs/test-no-external-cjs'
import importBuiltinCjs from '@vitejs/test-import-builtin-cjs'
import { hello as linkedNoExternal } from '@vitejs/test-linked-no-external'
import virtualMessage from '@vitejs/test-pkg-exports/virtual'
import moduleConditionMessage from '@vitejs/test-module-condition'
import '@vitejs/test-css-lib'

// This import will set a 'Hello World!" message in the nested-external non-entry dependency
import '@vitejs/test-non-optimized-with-nested-external'

// These two are optimized and get the message from nested-external, if the dependency is
// not properly externalized and ends up bundled, the message will be undefined
import optimizedWithNestedExternal from '@vitejs/test-optimized-with-nested-external'
import optimizedCjsWithNestedExternal from '@vitejs/test-optimized-cjs-with-nested-external'

import { setMessage } from '@vitejs/test-external-entry/entry'
setMessage('Hello World!')
import externalUsingExternalEntry from '@vitejs/test-external-using-external-entry'
import isomorphicModuleMessage from 'virtual:isomorphic-module'

export async function render(url, rootDir) {
  let html = ''

  const encryptedMsg = await bcrypt.hash('Secret Message!', 10)
  html += `\n<p class="encrypted-msg">encrypted message: ${encryptedMsg}</p>`

  const fileContent = await readFileContent(path.resolve(rootDir, 'message'))
  html += `\n<p class="file-message">msg read via fs/promises: ${fileContent}</p>`

  html += `\n<p class="primitive-export-message">message from primitive export: ${primitiveExport}</p>`

  const tsDefaultExportMessage = tsDefaultExport()
  html += `\n<p class="ts-default-export-message">message from ts-default-export: ${tsDefaultExportMessage}</p>`

  const tsNamedExportMessage = tsNamedExport()
  html += `\n<p class="ts-named-export-message">message from ts-named-export: ${tsNamedExportMessage}</p>`

  const objectAssignedExportsMessage = objectAssignedExports.hello()
  html += `\n<p class="object-assigned-exports-message">message from object-assigned-exports: ${objectAssignedExportsMessage}</p>`

  const forwardedExportMessage = forwardedExport.hello()
  html += `\n<p class="forwarded-export-message">message from forwarded-export: ${forwardedExportMessage}</p>`

  const definePropertiesExportsMsg = definePropertiesExports.hello()
  html += `\n<p class="define-properties-exports-msg">message from define-properties-exports: ${definePropertiesExportsMsg}</p>`

  const definePropertyExportsMsg = definePropertyExports.hello()
  html += `\n<p class="define-property-exports-msg">message from define-property-exports: ${definePropertyExportsMsg}</p>`

  const onlyObjectAssignedExportsMessage = onlyObjectAssignedExports.hello()
  html += `\n<p class="only-object-assigned-exports-msg">message from only-object-assigned-exports: ${onlyObjectAssignedExportsMessage}</p>`

  const requireAbsoluteMessage = requireAbsolute.hello()
  html += `\n<p class="require-absolute-msg">message from require-absolute: ${requireAbsoluteMessage}</p>`

  const noExternalCjsMessage = noExternalCjs.hello()
  html += `\n<p class="no-external-cjs-msg">message from no-external-cjs: ${noExternalCjsMessage}</p>`

  const importBuiltinCjsMessage = importBuiltinCjs.hello()
  html += `\n<p class="import-builtin-cjs-msg">message from import-builtin-cjs: ${importBuiltinCjsMessage}</p>`

  const optimizedWithNestedExternalMessage = optimizedWithNestedExternal.hello()
  html += `\n<p class="optimized-with-nested-external">message from optimized-with-nested-external: ${optimizedWithNestedExternalMessage}</p>`

  const optimizedCjsWithNestedExternalMessage =
    optimizedCjsWithNestedExternal.hello()
  html += `\n<p class="optimized-cjs-with-nested-external">message from optimized-cjs-with-nested-external: ${optimizedCjsWithNestedExternalMessage}</p>`

  const externalUsingExternalEntryMessage = externalUsingExternalEntry.hello()
  html += `\n<p class="external-using-external-entry">message from external-using-external-entry: ${externalUsingExternalEntryMessage}</p>`

  const linkedNoExternalMessage = linkedNoExternal()
  html += `\n<p class="linked-no-external">linked-no-external msg: ${linkedNoExternalMessage}</p>`

  html += `\n<p class="dep-virtual">message from dep-virtual: ${virtualMessage}</p>`

  html += `\n<p class="css-lib">I should be blue</p>`

  html += `\n<p class="module-condition">${moduleConditionMessage}</p>`

  html += `\n<p class="isomorphic-module-server">${isomorphicModuleMessage}</p>`

  html += `\n<p class="isomorphic-module-browser"></p>`

  return html + '\n'
}
