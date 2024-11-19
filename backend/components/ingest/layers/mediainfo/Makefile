build-MediaInfoLayer:
	mkdir -p "$(ARTIFACTS_DIR)/python"
	cp mediainfo.py "$(ARTIFACTS_DIR)/python"
	python -m pip install -r requirements.txt -t "$(ARTIFACTS_DIR)/python"
	curl -O https://mediaarea.net/download/binary/libmediainfo0/24.06/MediaInfo_DLL_24.06_Lambda_arm64.zip
	unzip MediaInfo_DLL_24.06_Lambda_arm64.zip -d "$(ARTIFACTS_DIR)/"
	rm -f MediaInfo_DLL_24.06_Lambda_arm64.zip
