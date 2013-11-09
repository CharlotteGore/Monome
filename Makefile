
build: components index.js
	@component build
	@flatinator -n monome --app monome

components: component.json
	@component install

clean:
	rm -fr build components template.js

.PHONY: clean
