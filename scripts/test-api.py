
try:
    from youtube_transcript_api import YouTubeTranscriptApi
    print("Import successful")
    print("Dir:", dir(YouTubeTranscriptApi))
    
    try:
        t = YouTubeTranscriptApi.get_transcript("-qDjXvhu8R0")
        print("Transcript fetched:", len(t))
    except Exception as e:
        print("Fetch Error:", e)

except Exception as e:
    print("Import Error:", e)
