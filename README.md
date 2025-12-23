# Scalar OpenAPI Preview

A Visual Studio Code extension that provides a beautiful, interactive preview of OpenAPI/Swagger specifications using the [Scalar](https://scalar.com) API reference viewer.

![Scalar Preview](/media/screenshot.png)

## Features

- **Beautiful UI** - Modern, responsive API documentation viewer
- **JSON & YAML support** - Works with both OpenAPI formats
- **Live reload** - Preview updates automatically when you save
- **Theme support** - Respects your VS Code theme (dark/light)
- **Sidebar navigation** - Easy navigation through your API
- **Try it out** - Test your API endpoints directly

## Usage

1. Open any OpenAPI/Swagger specification file (`.json`, `.yaml`, or `.yml`)
2. Use any of these methods to open the preview:
   - **Command Palette**: Press `Ctrl+Shift+P` and type "Scalar: Open Preview"
   - **Context Menu**: Right-click on a file in the explorer and select "Scalar: Open Preview"
   - **Editor Title**: Click the preview icon in the editor title bar

## Configuration

You can customize the Scalar viewer through VS Code settings:

| Setting | Description | Default |
|---------|-------------|---------|
| `scalar.theme` | Viewer theme (`auto`, `light`, `dark`, `purple`, `solarized`, etc.) | `auto` |
| `scalar.showSidebar` | Show/hide the sidebar navigation | `true` |
| `scalar.hideModels` | Hide the models/schemas section | `false` |

## Supported Specifications

- OpenAPI 3.0.x
- OpenAPI 3.1.x
- Swagger 2.0

## Requirements

- Visual Studio Code 1.85.0 or higher

## Development

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes
npm run watch

# Package extension
npm run package
```

## Credits

- [Scalar](https://scalar.com) - The amazing API reference viewer

## License

MIT
