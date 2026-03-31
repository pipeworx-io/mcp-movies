# @pipeworx/mcp-movies

MCP server for movies and TV shows — search via [iTunes Search API](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/) and [TVmaze API](https://www.tvmaze.com/api) (both free, no auth required).

## Tools

| Tool | Description |
|------|-------------|
| `search_movies` | Search for movies by title or keyword via iTunes |
| `search_tv_shows` | Search for TV shows by name via TVmaze |
| `get_tv_show` | Get full TV show details including episode list |
| `get_tv_schedule` | Get the TV broadcast schedule for a country and date |

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

Or run via CLI:

```bash
npx pipeworx use movies
```

## License

MIT
