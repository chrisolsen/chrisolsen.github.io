pdf:
	pandoc \
		--pdf-engine=xelatex \
		-f markdown resume.md \
		-o out/resume.pdf

html:
	pandoc \
		-f markdown resume.md \
		-o tmp.html
	sed -e "/CONTENT/ r tmp.html" -e s/CONTENT// _template.html > index.html
	rm tmp.html


docx:
	pandoc \
		-f markdown resume.md \
		-o out/resume.docx

readme:
	pandoc \
		-f markdown resume.md \
		-o README.md
	sed '/^```/,/^```/ d' README.md > temp && mv temp README.md
