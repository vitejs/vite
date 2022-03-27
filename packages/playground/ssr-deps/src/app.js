import path from 'path'
import readFileContent from 'read-file-content'
import primitiveExport from 'primitive-export'
import tsDefaultExport, { hello as tsNamedExport } from 'ts-transpiled-exports'
import objectAssignedExports from 'object-assigned-exports'
import forwardedExport from 'forwarded-export'
import bcrypt from 'bcrypt'
import definePropertiesExports from 'define-properties-exports'
import definePropertyExports from 'define-property-exports'
import onlyObjectAssignedExports from 'only-object-assigned-exports'
import requireAbsolute from 'require-absolute'

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

  return html + '\n'
}
