.PHONY: zip
zip:
	if [ -d "dist" ]; then zip -r dist.zip dist; else echo "run 'npm run build'"; fi;