# Security Policy

## Supported Versions

Refer to the [Releases](https://vite.dev/releases) page in the documentation for the supported Vite versions.

## Threat Model

This section describes what Vite treats as trusted and untrusted. A report is only considered a Vite vulnerability if it does not require compromising a trusted element first.

> [!NOTE]
> Reports that fall outside the threat model will still be fixed if they represent a real issue, but they will not be treated as security vulnerabilities (e.g., no CVE or advisory will be issued).

### What Vite Does Not Trust

1. **Network data and untrusted clients**
   The dev server and preview server must treat all inbound network requests as potentially hostile. This includes malformed requests. Clients may be outside the developer's intended environment because of port-forwarding, shared networks, or accidental exposure to the internet.

### What Vite Trusts

1. **Developers and their infrastructure**
   The people who invoke Vite and the environments they use (local workstations, CI runners, containers, the operating system, and the Node.js runtime) are all assumed to be under the developer's control and properly secured.

2. **Configuration and plugins**
   Everything in `vite.config.*`, the code it imports, CLI flags, and all plugins together with their transitive dependencies are treated as developer-authored and therefore trusted.

3. **Project files and dependencies**
   All source files, assets, and installed packages (including everything in `node_modules`) that the project references are trusted.

4. **Developer-configured network targets**
   Outbound connections the developer sets up explicitly (e.g., proxy rules in `server.proxy`) are trusted because the developer chose them.

### Dev Server & Preview Server

- Availability issues are not considered vulnerabilities.
- Files within the configured `server.fs` boundary (dev server) or the `build.outDir` directory (preview server) are expected to be accessible to clients.
- The existence of files is not hidden and cannot be hidden due to the development tool nature. Exposing file existence is not considered a vulnerability.

### Build Output

- Availability issues that affect the build process are not considered vulnerabilities.
- Availability issues in the build output caused by the code that Vite itself injects into the build output are in scope.
- Vulnerabilities in user-written code or plugin-generated code in the build output are not in scope.

### Examples of Vulnerabilities (in scope)

- A crafted URL causes the dev server to return file contents outside the `server.fs` boundary.
  - `server.fs.deny` bypassed with a crafted HTTP request ([GHSA-356w-63v5-8wf4](https://github.com/vitejs/vite/security/advisories/GHSA-356w-63v5-8wf4))
- An unauthenticated WebSocket client injects HMR messages that execute arbitrary JavaScript on the developer's machine.
- Missing or bypassable origin / host validation allows a cross-origin page to access dev-server endpoints that Vite documents as protected.
- A flaw in code that Vite injects into the production bundle, such as the module-preload polyfill, introduces XSS.
  - DOM Clobbering Gadget in `module-preload-polyfill` leading to XSS ([GHSA-64vr-g452-qvp3](https://github.com/vitejs/vite/security/advisories/GHSA-64vr-g452-qvp3))

### Examples of Non-Vulnerabilities (out of scope)

- Malicious Plugins or Dependencies (CWE-1357): Plugins, config files, and their dependency trees run with full trust at build time. A compromised plugin that exfiltrates data or executes arbitrary code is a supply-chain concern for the project, not a Vite vulnerability.
- Security Issues in the Application's Own Output: Flaws such as XSS, CSRF, or CSP misconfigurations in the bundled application are the responsibility of the application author. Vite transforms and bundles code but does not guarantee the security properties of the output beyond the code it injects itself.
- Secrets Exposed Through Misconfiguration: If a developer accidentally ships secrets to the client, for example by prefixing sensitive variables with `VITE_` or misconfiguring `define`, that is a project-level configuration mistake, not a Vite vulnerability.
- Reading Files Within Configured Paths (CWE-427): Vite is expected to read any file the project's configuration makes reachable. Pointing Vite at a directory that contains sensitive material is a configuration choice, not a Vite vulnerability.
- Attacker With Control Over Configuration (CWE-15): An attacker who can modify environment variables, CLI flags, or `vite.config.*` already controls a trusted input. Any consequences of that control are out of scope.
- Bugs in the Runtime or Operating System: Vulnerabilities in Node.js, the OS kernel, or other platform-level components are not considered a vulnerability in Vite.

## Reporting a Vulnerability

To report a vulnerability, please open a private vulnerability report at https://github.com/vitejs/vite/security. Please do not report upstream vulnerabilities unless the code is bundled in Vite's package.

While the discovery of new vulnerabilities is rare, we also recommend always using the latest versions of Vite and its official plugins to ensure your application remains as secure as possible.
