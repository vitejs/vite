import { readdir, stat } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import picomatch from "picomatch";
import prettyBytes from "pretty-bytes";
import type { Plugin, ResolvedConfig } from "../..";

const myTemplate = ({ rootName, hasParent, values }: {
    rootName: string;
    hasParent: boolean;
    values: {
      name: string;
      url: string;
      isdir: number;
      size: number;
      size_string: string;
      date_modified: number;
      date_modified_string: string;
    }[];
  }) => `
<!DOCTYPE html>

<html dir="ltr" lang="en">

<head>
<meta charset="utf-8">
<meta name="color-scheme" content="light dark">
<meta name="google" value="notranslate">

<script>
function addRow(name, url, isdir,
    size, size_string, date_modified, date_modified_string) {
  if (name == "." || name == "..")
    return;

  var root = document.location.pathname;
  if (root.substr(-1) !== "/")
    root += "/";

  var tbody = document.getElementById("tbody");
  var row = document.createElement("tr");
  var file_cell = document.createElement("td");
  var link = document.createElement("a");

  link.className = isdir ? "icon dir" : "icon file";

  if (isdir) {
    name = name + "/";
    url = url + "/";
    size = 0;
    size_string = "";
  } else {
    link.draggable = "true";
    link.addEventListener("dragstart", onDragStart, false);
  }
  link.innerText = name;
  link.href = root + url;

  file_cell.dataset.value = name;
  file_cell.appendChild(link);

  row.appendChild(file_cell);
  row.appendChild(createCell(size, size_string));
  row.appendChild(createCell(date_modified, date_modified_string));

  tbody.appendChild(row);
}

function onDragStart(e) {
  var el = e.srcElement;
  var name = el.innerText.replace(":", "");
  var download_url_data = "application/octet-stream:" + name + ":" + el.href;
  e.dataTransfer.setData("DownloadURL", download_url_data);
  e.dataTransfer.effectAllowed = "copy";
}

function createCell(value, text) {
  var cell = document.createElement("td");
  cell.setAttribute("class", "detailsColumn");
  cell.dataset.value = value;
  cell.innerText = text;
  return cell;
}

function start(location) {
  var header = document.getElementById("header");
  header.innerText = header.innerText.replace("LOCATION", location);

  document.getElementById("title").innerText = header.innerText;
}

function onHasParentDirectory() {
  var box = document.getElementById("parentDirLinkBox");
  box.style.display = "block";

  var root = document.location.pathname;
  if (!root.endsWith("/"))
    root += "/";

  var link = document.getElementById("parentDirLink");
  link.href = root + "..";
}

function sortTable(column) {
  var theader = document.getElementById("theader");
  var oldOrder = theader.cells[column].dataset.order || '1';
  oldOrder = parseInt(oldOrder, 10)
  var newOrder = 0 - oldOrder;
  theader.cells[column].dataset.order = newOrder;

  var tbody = document.getElementById("tbody");
  var rows = tbody.rows;
  var list = [], i;
  for (i = 0; i < rows.length; i++) {
    list.push(rows[i]);
  }

  list.sort(function(row1, row2) {
    var a = row1.cells[column].dataset.value;
    var b = row2.cells[column].dataset.value;
    if (column) {
      a = parseInt(a, 10);
      b = parseInt(b, 10);
      return a > b ? newOrder : a < b ? oldOrder : 0;
    }

    // Column 0 is text.
    if (a > b)
      return newOrder;
    if (a < b)
      return oldOrder;
    return 0;
  });

  // Appending an existing child again just moves it.
  for (i = 0; i < list.length; i++) {
    tbody.appendChild(list[i]);
  }
}

// Add event handlers to column headers.
function addHandlers(element, column) {
  element.onclick = (e) => sortTable(column);
  element.onkeydown = (e) => {
    if (e.key == 'Enter' || e.key == ' ') {
      sortTable(column);
      e.preventDefault();
    }
  };
}

function onLoad() {
  addHandlers(document.getElementById('nameColumnHeader'), 0);
  addHandlers(document.getElementById('sizeColumnHeader'), 1);
  addHandlers(document.getElementById('dateColumnHeader'), 2);
}

window.addEventListener('DOMContentLoaded', onLoad);
</script>

<style>

  h1 {
    border-bottom: 1px solid #c0c0c0;
    margin-bottom: 10px;
    padding-bottom: 10px;
    white-space: nowrap;
  }

  table {
    border-collapse: collapse;
  }

  th {
    cursor: pointer;
  }

  td.detailsColumn {
    padding-inline-start: 2em;
    text-align: end;
    white-space: nowrap;
  }

  a.icon {
    padding-inline-start: 1.5em;
    text-decoration: none;
    user-select: auto;
  }

  a.icon:hover {
    text-decoration: underline;
  }

  a.file {
    background : url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAABnRSTlMAAAAAAABupgeRAAABEElEQVR42nRRx3HDMBC846AHZ7sP54BmWAyrsP588qnwlhqw/k4v5ZwWxM1hzmGRgV1cYqrRarXoH2w2m6qqiqKIR6cPtzc3xMSML2Te7XZZlnW7Pe/91/dX47WRBHuA9oyGmRknzGDjab1ePzw8bLfb6WRalmW4ip9FDVpYSWZgOp12Oh3nXJ7nxoJSGEciteP9y+fH52q1euv38WosqA6T2gGOT44vry7BEQtJkMAMMpa6JagAMcUfWYa4hkkzAc7fFlSjwqCoOUYAF5RjHZPVCFBOtSBGfgUDji3c3jpibeEMQhIMh8NwshqyRsBJgvF4jMs/YlVR5KhgNpuBLzk0OcUiR3CMhcPaOzsZiAAA/AjmaB3WZIkAAAAASUVORK5CYII=") left top no-repeat;
  }

  a.dir {
    background : url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABt0lEQVR42oxStZoWQRCs2cXdHTLcHZ6EjAwnQWIkJyQlRt4Cd3d3d1n5d7q7ju1zv/q+mh6taQsk8fn29kPDRo87SDMQcNAUJgIQkBjdAoRKdXjm2mOH0AqS+PlkP8sfp0h93iu/PDji9s2FzSSJVg5ykZqWgfGRr9rAAAQiDFoB1OfyESZEB7iAI0lHwLREQBcQQKqo8p+gNUCguwCNAAUQAcFOb0NNGjT+BbUC2YsHZpWLhC6/m0chqIoM1LKbQIIBwlTQE1xAo9QDGDPYf6rkTpPc92gCUYVJAZjhyZltJ95f3zuvLYRGWWCUNkDL2333McBh4kaLlxg+aTmyL7c2xTjkN4Bt7oE3DBP/3SRz65R/bkmBRPGzcRNHYuzMjaj+fdnaFoJUEdTSXfaHbe7XNnMPyqryPcmfY+zURaAB7SHk9cXSH4fQ5rojgCAVIuqCNWgRhLYLhJB4k3iZfIPtnQiCpjAzeBIRXMA6emAqoEbQSoDdGxFUrxS1AYcpaNbBgyQBGJEOnYOeENKR/iAd1npusI4C75/c3539+nbUjOgZV5CkAU27df40lH+agUdIuA/EAgDmZnwZlhDc0wAAAABJRU5ErkJggg==") left top no-repeat;
  }

  a.up {
    background : url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACM0lEQVR42myTA+w1RxRHz+zftmrbdlTbtq04qRGrCmvbDWp9tq3a7tPcub8mj9XZ3eHOGQdJAHw77/LbZuvnWy+c/CIAd+91CMf3bo+bgcBiBAGIZKXb19/zodsAkFT+3px+ssYfyHTQW5tr05dCOf3xN49KaVX9+2zy1dX4XMk+5JflN5MBPL30oVsvnvEyp+18Nt3ZAErQMSFOfelCFvw0HcUloDayljZkX+MmamTAMTe+d+ltZ+1wEaRAX/MAnkJdcujzZyErIiVSzCEvIiq4O83AG7LAkwsfIgAnbncag82jfPPdd9RQyhPkpNJvKJWQBKlYFmQA315n4YPNjwMAZYy0TgAweedLmLzTJSTLIxkWDaVCVfAbbiKjytgmm+EGpMBYW0WwwbZ7lL8anox/UxekaOW544HO0ANAshxuORT/RG5YSrjlwZ3lM955tlQqbtVMlWIhjwzkAVFB8Q9EAAA3AFJ+DR3DO/Pnd3NPi7H117rAzWjpEs8vfIqsGZpaweOfEAAFJKuM0v6kf2iC5pZ9+fmLSZfWBVaKfLLNOXj6lYY0V2lfyVCIsVzmcRV9Y0fx02eTaEwhl2PDrXcjFdYRAohQmS8QEFLCLKGYA0AeEakhCCFDXqxsE0AQACgAQp5w96o0lAXuNASeDKWIvADiHwigfBINpWKtAXJvCEKWgSJNbRvxf4SmrnKDpvZavePu1K/zu/due1X/6Nj90MBd/J2Cic7WjBp/jUdIuA8AUtd65M+PzXIAAAAASUVORK5CYII=") left top no-repeat;
  }

  html[dir=rtl] a {
    background-position-x: right;
  }

  #parentDirLinkBox {
    margin-bottom: 10px;
    padding-bottom: 10px;
  }
</style>

<title id="title"></title>

</head>

<body>

<h1 id="header">Index of LOCATION</h1>

<div id="parentDirLinkBox" style="display:none">
  <a id="parentDirLink" class="icon up">
    <span id="parentDirText">[parent directory]</span>
  </a>
</div>

<table>
  <thead>
    <tr class="header" id="theader">
      <th id="nameColumnHeader" tabindex=0 role="button">Name</th>
      <th id="sizeColumnHeader" class="detailsColumn" tabindex=0 role="button">
        Size
      </th>
      <th id="dateColumnHeader" class="detailsColumn" tabindex=0 role="button">
        Date Modified
      </th>
    </tr>
  </thead>
  <tbody id="tbody">
  </tbody>
</table>

</body>

</html>
<script>"use strict";
// Copyright 2012 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
var loadTimeData;class LoadTimeData{constructor(){this.data_=null}set data(value){expect(!this.data_,"Re-setting data.");this.data_=value}valueExists(id){return id in this.data_}getValue(id){expect(this.data_,"No data. Did you remember to include strings.js?");const value=this.data_[id];expect(typeof value!=="undefined","Could not find value for "+id);return value}getString(id){const value=this.getValue(id);expectIsType(id,value,"string");return value}getStringF(id,var_args){const value=this.getString(id);if(!value){return""}const args=Array.prototype.slice.call(arguments);args[0]=value;return this.substituteString.apply(this,args)}substituteString(label,var_args){const varArgs=arguments;return label.replace(/\$(.|$|\n)/g,(function(m){expect(m.match(/\$[$1-9]/),"Unescaped $ found in localized string.");return m==="$$"?"$":varArgs[m[1]]}))}getBoolean(id){const value=this.getValue(id);expectIsType(id,value,"boolean");return value}getInteger(id){const value=this.getValue(id);expectIsType(id,value,"number");expect(value===Math.floor(value),"Number isn't integer: "+value);return value}overrideValues(replacements){expect(typeof replacements==="object","Replacements must be a dictionary object.");for(const key in replacements){this.data_[key]=replacements[key]}}}function expect(condition,message){if(!condition){throw new Error("Unexpected condition on "+document.location.href+": "+message)}}function expectIsType(id,value,type){expect(typeof value===type,"["+value+"] ("+id+") is not a "+type)}expect(!loadTimeData,"should only include this file once");loadTimeData=new LoadTimeData;window.loadTimeData=loadTimeData;console.warn("crbug/1173575, non-JS module files deprecated.");</script><script>loadTimeData.data = {"header":"Index of LOCATION","headerDateModified":"Date Modified","headerName":"Name","headerSize":"Size","language":"en","parentDirText":"[parent directory]","textdirection":"ltr"};</script>
<script>start(${JSON.stringify(rootName)});</script>
${hasParent ? `<script>onHasParentDirectory();</script>` : ""}
${values
  .map(
    ({
      name,
      url,
      isdir,
      size,
      size_string,
      date_modified,
      date_modified_string,
    }) =>
      // prettier-ignore
      `<script>addRow(${JSON.stringify(name)}, ${JSON.stringify(url)}, ${JSON.stringify(isdir)}, ${JSON.stringify(size)}, ${JSON.stringify(size_string)}, ${JSON.stringify(date_modified)}, ${JSON.stringify(date_modified_string)});</script>`,
  )
  .join("\n")}`;

function directoryIndex(options: {} = {}): Pick<Plugin, "name" | "configResolved" | "configureServer"> {
  let config: ResolvedConfig
  return {
    name: "directory-index",
    configResolved(config2) {
      config = config2;
    },
    configureServer(server) {
      if (config.mode !== "development") {
        return;
      }
      server.middlewares.use(async (req, res, next) => {
        if (res.headersSent) {
          return next();
        }
        const url = new URL(req.originalUrl!, "http://localhost");
        //== URL { http://localhost/hello/world/ }
        const rootURL = pathToFileURL(config.root);
        if (!rootURL.pathname.endsWith("/")) {
          rootURL.pathname += "/";
        }
        //== URL { file:///my/project/ }
        const dirURL = new URL(url.pathname.slice(1), rootURL);
        if (!dirURL.pathname.endsWith("/")) {
          dirURL.pathname += "/";
        }
        //== URL { file:///my/project/hello/world/ }
        const indexStats = await stat(new URL("index.html", dirURL)).catch(
          () => null,
        );
        if (indexStats) {
          return next();
        }
        const stats = await stat(dirURL).catch(() => null);
        if (stats?.isDirectory()) {
          if (url.pathname.endsWith("/")) {
            const dirents = await readdir(dirURL, { withFileTypes: true });
            const dirPath = fileURLToPath(dirURL);
            const allowedDirents = dirents.filter((entry) => {
              const entryPath = join(dirPath, entry.name);
              if (
                config.server.fs.deny.some((x) => {
                  const matcher = picomatch(x, { cwd: config.root });
                  const relativePath = relative(config.root, entryPath);
                  return matcher(relativePath);
                })
              ) {
                return false;
              }
              if (config.server.fs.strict) {
                return config.server.fs.allow.some((x) => {
                  const dirPath = resolve(config.root, x);
                  return (entryPath + sep).startsWith(dirPath + sep);
                });
              } else {
                return true;
              }
            });
            const dirDirents = allowedDirents
              .filter((x) => x.isDirectory())
              .sort();
            const fileDirents = allowedDirents.filter((x) => x.isFile()).sort();
            const dirValues = dirDirents.map((dir) => ({
              name: dir.name,
              url: encodeURIComponent(dir.name),
              isdir: 1,
              size: 0,
              size_string: "",
              date_modified: 0,
              date_modified_string: "",
            }));
            const fileValues = await Promise.all(
              fileDirents.map(async (file) => {
                const relativeURL = encodeURIComponent(file.name);
                const stats = await stat(new URL(relativeURL, dirURL));
                return {
                  name: file.name,
                  url: relativeURL,
                  isdir: 0,
                  size: stats.size,
                  size_string: prettyBytes(stats.size),
                  date_modified: stats.mtimeMs,
                  date_modified_string: stats.mtime.toLocaleString(),
                };
              }),
            );
            const html = myTemplate({
              rootName: url.pathname,
              hasParent: url.pathname !== "/",
              values: [...dirValues, ...fileValues],
            });
            res.statusCode = 200;
            res.setHeader("Content-Type", "text/html");
            res.end(html);
            return;
          } else {
            res.statusCode = 302;
            res.setHeader("Location", url.pathname + "/");
            res.end();
            return;
          }
        }
        return next();
      });
    },
  } satisfies Plugin
}

export default directoryIndex;
