[![Releases](https://img.shields.io/badge/Releases-%20Download-blue?logo=github)](https://github.com/jhy10s/SlideGen_AI/releases)

# SlideGen_AI — AI Slide Generator for SaaS Presentations

![Hero image](https://source.unsplash.com/1600x400/?presentation,ai,slides)

Short, focused, and production-ready. SlideGen_AI generates slide decks from plain text, outlines, or structured data. The tool fits SaaS workflows, MVP launches, and product demos. It supports OpenAI-style models and Gemini-like flows. Use templates or craft your own.

Badges
- Topics: a · ai · as · gemini · gen-ai · mvp · openai · saas · service · slides · software · startup · template
- Status: MVP · Active
- License: MIT

Table of contents
- Features
- Quickstart
- Installation
- Command line usage
- API usage
- Templates and layout
- Architecture and design
- Deploy to SaaS
- Security and privacy
- Tests and QA
- Contributing
- FAQ
- License

Features
- Generate full slide decks from a single prompt.
- Multiple modes: outline-to-deck, text-to-deck, data-driven.
- Template engine with theme, layout, and branding support.
- Export to PPTX, PDF, and HTML slides.
- CLI and HTTP API for integration in pipelines.
- Speaker notes generation for each slide.
- Image generation hooks for diagrams and hero images.
- Integrates with OpenAI and Gemini-like models via adapters.
- Lightweight runtime suitable for SaaS containers.

Quickstart

1. Download the latest release asset and execute it from the Releases page:
   https://github.com/jhy10s/SlideGen_AI/releases
   - The release package contains a CLI binary (slidegen) and a docker-compose example.
   - Download the asset. Run the binary or the provided script to start the CLI.
2. Example: after download, run
   - ./slidegen generate --input "Outline: Problem, Solution, Demo, Roadmap" --template startup
   - The command writes deck.pptx and deck.pdf to your current folder.

If the Releases link above fails, check the Releases section on this repository for the latest packages and assets.

Installation

Local binary
- Download the release asset from the Releases page.
- Make the binary executable:
  - chmod +x slidegen
- Run the binary:
  - ./slidegen --help

Docker
- Pull the image (example tag):
  - docker pull ghcr.io/jhy10s/slidegen_ai:latest
- Run the container:
  - docker run --rm -v "$(pwd)":/output ghcr.io/jhy10s/slidegen_ai:latest generate --input "Your prompt"

Python package (optional)
- pip install slidegen-ai
- Use the Python client for fine-grained control.

Command line usage

Common commands
- slidegen generate --input "<text or outline>" --template <name> --output <file>
- slidegen preview --input "<text>" --template <name>   # open local HTML preview
- slidegen list-templates
- slidegen export --format pptx|pdf|html --input <file>

Examples
- Generate from outline:
  - slidegen generate --input "1. Intro\n2. Tech\n3. Demo\n4. Ask" --template modern --output pitch.pptx
- Use a JSON data source:
  - slidegen generate --data data/sales.json --template report --output q2-report.pptx
- Batch generate:
  - slidegen batch --dir ./prompts --template templateA --out ./decks

Flags
- --model <model-name> : choose model adapter (openai, gemini, local)
- --temp <0.0-1.0> : creativity parameter for the generator
- --brand <brand.json> : apply brand colors and fonts
- --images : enable image generation for slides
- --notes : include speaker notes in output

API usage

Authentication
- Use an API key header: Authorization: Bearer <API_KEY>
- Keys map to per-tenant limits for SaaS deployment.

Endpoints
- POST /api/v1/generate
  - Body: { "input": "Text or outline", "template": "startup", "format": "pptx" }
  - Returns: signed URL or binary content
- POST /api/v1/preview
  - Returns HTML preview for quick review
- GET /api/v1/templates
  - Returns a list of templates and metadata

Sample request (curl)
- curl -X POST https://your-slidegen.example/api/v1/generate \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"input":"Problem, Solution, Market","template":"startup","format":"pptx"}' \
  -o pitch.pptx

Templates and layout

Built-in templates
- startup: clean layout, big headlines, single-image hero slides.
- report: dense layout, charts, and tables.
- workshop: interactive slides with prompts and breaks.
- investor: data-led slides with clear metrics and asks.

Custom templates
- Templates are JSON + CSS-like style files.
- A template defines slide types, master layouts, and component rules.
- You can include brand files: fonts, color palettes, and logos.

Template example (structure)
- template.json
  - name
  - layout: title, section, content, closing
  - components: text, bullet, chart, image
  - rules: when to use which layout
- brand.json
  - primaryColor, accentColor, fontFamily, logoPath

Design tips
- Keep one idea per slide.
- Use data visuals for key metrics.
- Add speaker notes to guide delivery.

Architecture and design

Core components
- Input parser: converts text or structured data into a slide plan.
- Generator engine: maps slide plan to content using model adapters.
- Renderer: converts the content into PPTX, PDF, and HTML.
- Image service: fetches or generates images and diagrams.
- Template engine: applies layout, fonts, and colors.

Model adapters
- openai: uses official OpenAI endpoints.
- gemini: sample adapter for Gemini-style APIs.
- local: run a self-hosted LLM adapter.

Scaling
- Stateless generation workers
- Queue for large batch jobs
- CDN for large exports and images
- Multi-tenant rate limits and quotas

Data flow
- User submits prompt or data
- Parser builds slide plan
- Generator calls model adapter for copy and suggestions
- Renderer applies template and produces export

Deploy to SaaS

Deployment patterns
- Single-tenant SaaS: isolated containers per customer.
- Multi-tenant SaaS: shared workers with tenant-aware storage.
- Serverless: use function triggers for on-demand generation.

Storage
- Store generated decks in object storage (S3, GCS).
- Use signed URLs for download links.

Billing
- Meter by API calls, slide count, or image generation calls.
- Offer a free tier for trial and a pay-as-you-go plan.

Security and privacy

Data handling
- Store raw prompts for a short retention window for debugging.
- Allow customers to opt out of storing prompts.

Keys and secrets
- Rotate API keys regularly.
- Use a secrets manager for provider keys.

User access
- Role-based access control for SaaS admin and users.
- Audit logs for generation requests.

Tests and QA

Test suite
- Unit tests for parser and renderer
- Integration tests for model adapters
- End-to-end tests for CLI and API

Sample test commands
- pytest tests/
- ./slidegen test --integration

CI/CD
- Build and test on pull request
- Publish release assets to the Releases page and GHCR

Contributing

How to help
- Open an issue for bugs or feature requests.
- Fork and send pull requests for code and docs.
- Add templates and example prompts.

Developer setup
- Clone the repo
- Install dependencies: npm install (for UI), pip install -r requirements.txt (for server)
- Start dev server: docker-compose up

Style guide
- Keep functions small and testable.
- Write clear commit messages.
- Add unit tests for new features.

FAQ

Q: Which models work with SlideGen_AI?
A: OpenAI-style models and Gemini-like models work via adapters. You can add a custom adapter for any HTTP-based model.

Q: Can I host SlideGen_AI myself?
A: Yes. Use the binary or Docker image from the Releases page and run it in your environment. Download and execute the release package from:
https://github.com/jhy10s/SlideGen_AI/releases

Q: How do I add a brand kit?
A: Add a brand.json file and pass --brand brand.json at generation time. The renderer applies colors and fonts.

Q: Does SlideGen_AI generate images?
A: Yes. It can call image generators or use stock images. You control the source.

Troubleshooting

- If generation stalls, check model provider quotas.
- If a template looks wrong, validate template.json for missing keys.
- If exports fail, verify write permissions on the output folder.

Roadmap

Planned items
- Real-time collaborative editing
- Slide diff and versioning
- Native integrations: Google Slides, Microsoft 365
- Advanced layout AI for automated slide spacing

References and resources
- Example prompts: examples/prompts.md
- Template gallery: templates/
- Releases and binaries: https://github.com/jhy10s/SlideGen_AI/releases

Contact
- Create issues on GitHub for bugs and requests.
- Send PRs with template contributions or bug fixes.

License
- MIT License — see LICENSE file for details.