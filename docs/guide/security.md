# Security

Vite implements several security mechanisms to protect your development environment from common attack vectors.

## WebSocket Security

### Token-Based Authentication

Vite's development server uses a token-based authentication system to secure WebSocket connections for Hot Module Replacement (HMR). This prevents Cross-Site WebSocket Hijacking (CSWSH) attacks where malicious websites attempt to establish WebSocket connections to your local development server.

#### How It Works

1. When the dev server starts, it generates a random security token
2. The token is embedded in the client code served to the browser
3. When establishing a WebSocket connection, the client includes this token
4. The server validates the token using timing-safe comparison to prevent timing attacks
5. Connections with invalid or missing tokens are rejected

This mechanism ensures that only clients that received the HTML from your development server can establish WebSocket connections.

#### Non-Browser Clients

If you need to connect to the Vite WebSocket server from non-browser clients (such as automated testing tools, mobile apps, or custom development tools), you have several options:

1. **Use `server.allowedHosts`** (recommended): Configure specific hostnames that are allowed to connect:

   ```js
   export default {
     server: {
       allowedHosts: ['my-custom-tool.local'],
     },
   }
   ```

2. **Disable token checking** (development only): Use the `@vitejs/plugin-legacy` option:

   ```js
   import legacy from '@vitejs/plugin-legacy'

   export default {
     plugins: [
       legacy({
         skipWebSocketTokenCheck: true,
       }),
     ],
   }
   ```

   ::: warning Security Warning
   Only use `skipWebSocketTokenCheck` in controlled development environments. This completely disables WebSocket authentication and makes your development server vulnerable to CSWSH attacks. Never use this setting when your development server is accessible from untrusted networks.
   :::

### Allowed Hosts Configuration

The `server.allowedHosts` option provides an additional layer of security by restricting which hostnames can access your development server. This is particularly useful when:

- Your development server is accessible over a network (not just localhost)
- You want to explicitly allowlist trusted domains
- You're running the server in a docker container or VM

Example configuration:

```js
export default {
  server: {
    allowedHosts: [
      'dev.example.com',
      'staging.example.com',
      '*.local', // Allow all .local domains
    ],
  },
}
```

::: tip
By default, Vite allows connections from `localhost` and `127.0.0.1`. You only need to configure `allowedHosts` when accepting connections from other hostnames.
:::

## Production Considerations

### Middleware Mode WebSocket Exposure

When using Vite in middleware mode with a custom server, be aware that:

1. The WebSocket server may be exposed on a different port than your main application
2. Token-based authentication still applies, but you're responsible for ensuring the WebSocket server isn't publicly accessible
3. Consider using `server.hmr.server` to attach the WebSocket server to your existing server instance

Example safe configuration:

```js
export default {
  server: {
    middlewareMode: true,
    hmr: {
      // Attach to your existing server instead of creating a new one
      server: yourHttpServer,
    },
  },
}
```

### Disable HMR in Production

Never expose Vite's HMR WebSocket server in production. Use Vite's build command to create optimized production builds instead:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

The development server (`vite`) should only be used during development. For production, use the output from `vite build`.

## Best Practices

1. **Use HTTPS in development** when working with sensitive data or authentication:

   ```js
   export default {
     server: {
       https: {
         key: fs.readFileSync('path/to/key.pem'),
         cert: fs.readFileSync('path/to/cert.pem'),
       },
     },
   }
   ```

2. **Bind to localhost only** unless you need network access:

   ```js
   export default {
     server: {
       host: 'localhost', // Don't expose to network unnecessarily
     },
   }
   ```

3. **Configure `allowedHosts`** when binding to `0.0.0.0` or specific network interfaces:

   ```js
   export default {
     server: {
       host: '0.0.0.0',
       allowedHosts: ['dev.mycompany.local'],
     },
   }
   ```

4. **Keep dependencies updated** to ensure you have the latest security patches

5. **Review custom middleware** for security vulnerabilities if you're using middleware mode

## Reporting Security Issues

If you discover a security vulnerability in Vite, please email [security@vitejs.dev](mailto:security@vitejs.dev). All security vulnerabilities will be promptly addressed.
