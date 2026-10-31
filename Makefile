THEME := jsonresume-theme-pro
PDF := Chris Olsen.pdf

.PHONY: all html md pdf validate dev

all: html md pdf

validate:
	npx resumed validate resume.json

html: index.html
md: README.md
pdf: Chris\ Olsen.pdf

index.html: resume.json
	npx resumed render resume.json --theme $(THEME) -o $@

README.md: resume.json scripts/to-markdown.js
	node scripts/to-markdown.js resume.json > $@

Chris\ Olsen.pdf: resume.json
	npx resumed export resume.json --theme $(THEME) -o "$(PDF)"

dev:
	npx http-server
