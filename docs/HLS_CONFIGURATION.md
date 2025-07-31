# HLS Configuration

## HLS Codec Mappings Parameter

**CloudFormation Output:** `HlsCodecsParameter`  
**Component:** HLS API (deployed when `DeployHlsApi` = "Yes")

This parameter defines bidirectional codec mappings between TAMS format identifiers and HLS codec strings, used for both HLS manifest generation and HLS content ingestion.

## Parameter Structure

```json
[
  {
    "tams": "audio/aac",
    "hls": "mp4a"
  },
  {
    "tams": "video/h264", 
    "hls": "avc1"
  },
  {
    "tams": "text/vtt",
    "hls": "webvtt"
  }
]
```

## Default Mappings

The parameter is created with these default codec mappings:

- **audio/aac** → **mp4a** (AAC audio)
- **video/h264** → **avc1** (H.264 video)
- **text/vtt** → **webvtt** (WebVTT subtitles)

## Usage

### HLS Generation

- Used by HLS API Lambda function to translate TAMS codec identifiers to HLS-compatible codec strings
- Applied during HLS manifest generation for sources and flows

### HLS Ingestion  

- Used by HLS ingestion functions to translate HLS codec strings back to TAMS format identifiers
- Applied when ingesting HLS content to create TAMS flows with correct codec metadata

### Supported Codecs

- Supports audio, video, and subtitle codec mappings
- Handles codec-specific essence parameters (for example, AVC profile/level, AAC object type)

## Customization

To add or modify codec mappings:

1. Navigate to AWS Systems Manager Parameter Store
2. Find the parameter using the `HlsCodecsParameter` CloudFormation output value
3. Edit the JSON array to add new mappings or modify existing ones
4. Changes take effect immediately for new HLS requests

## Example Custom Mapping

```json
[
  {
    "tams": "audio/aac",
    "hls": "mp4a"
  },
  {
    "tams": "video/h264",
    "hls": "avc1"
  },
  {
    "tams": "video/h265",
    "hls": "hev1"
  },
  {
    "tams": "text/vtt",
    "hls": "webvtt"
  }
]
```
