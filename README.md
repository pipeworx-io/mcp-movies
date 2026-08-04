# mcp-movies

Movies MCP — wraps iTunes Search API (movies, free, no auth) and TVmaze API (TV shows, free, no auth)

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `search_movies` | Search for movies by title or keyword. Returns title, director, release date, genre, description, and artwork. |
| `search_tv_shows` | Search for TV shows by name. Returns show name, genres, premiere/end dates, rating, summary, and images. |
| `get_tv_show` | Get complete TV show details including episodes, air dates, and ratings. Requires show ID from search_tv_shows. |
| `get_tv_schedule` | Check what's broadcasting on a specific date and country (e.g., 'US', 'GB'). Returns shows, times, and channels. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "movies": {
      "url": "https://gateway.pipeworx.io/movies/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Movies data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
