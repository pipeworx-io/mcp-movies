# mcp-movies

Movies MCP — wraps iTunes Search API (movies, free, no auth) and TVmaze API (TV shows, free, no auth)

Part of the [Pipeworx](https://pipeworx.io) open MCP gateway.

## Tools

| Tool | Description |
|------|-------------|

## Quick Start

Add to your MCP client config:

```json
{
  "mcpServers": {
    "movies": {
      "url": "https://gateway.pipeworx.io/movies/mcp"
    }
  }
}
```

Or use the CLI:

```bash
npx pipeworx use movies
```

## License

MIT
