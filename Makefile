THEME := jsonresume-theme-pro
PDF := Chris Olsen.pdf
COVER_LETTERS := $(patsubst %.md,%.pdf,$(wildcard cover-letters/*.md))

.PHONY: all html md pdf docx cover validate dev

all: html md pdf docx

validate:
	npx resumed validate resume.json

html: index.html
md: README.md
pdf: Chris\ Olsen.pdf
docx: Chris\ Olsen.docx
cover: $(COVER_LETTERS)

index.html: resume.json
	npx resumed render resume.json --theme $(THEME) -o $@

README.md: resume.json scripts/to-markdown.js scripts/dates.js
	node scripts/to-markdown.js resume.json > $@

Chris\ Olsen.docx: resume.json scripts/to-docx.js scripts/dates.js
	node scripts/to-docx.js resume.json "Chris Olsen.docx"

Chris\ Olsen.pdf: resume.json
	npx resumed export resume.json --theme $(THEME) -o "$(PDF)"

cover-letters/%.pdf: cover-letters/%.md resume.json scripts/cover-letter.js
	node scripts/cover-letter.js resume.json $< $@

dev:
	npx http-server
