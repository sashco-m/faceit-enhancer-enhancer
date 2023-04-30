.PHONY: zip
zip:
	if [ -d "load_me" ]; then zip -r dist.zip load_me; else echo "run 'npm run build'"; fi;