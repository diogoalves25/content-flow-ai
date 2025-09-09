const { extractYouTubeContent } = require('./src/lib/youtube-extractor.ts');

async function testTranscriptExtraction() {
  console.log('🧪 Testing transcript extraction locally...');
  
  try {
    const result = await extractYouTubeContent('https://www.youtube.com/watch?v=Hym02GyEI6Q');
    
    console.log('\n📊 EXTRACTION RESULTS:');
    console.log('Video ID:', result.videoId);
    console.log('Title:', result.metadata.title);
    console.log('Author:', result.metadata.author);
    console.log('Transcript Length:', result.fullTranscript.length, 'characters');
    console.log('Segment Count:', result.transcript.length);
    
    console.log('\n📝 FIRST 1000 CHARACTERS OF TRANSCRIPT:');
    console.log('='.repeat(60));
    console.log(result.fullTranscript.substring(0, 1000));
    console.log('='.repeat(60));
    
    // Check if extraction was successful
    if (result.fullTranscript.length < 100) {
      console.log('\n❌ EXTRACTION FAILED - transcript too short or fallback message');
      console.log('Full transcript content:', result.fullTranscript);
      return false;
    } else if (result.fullTranscript.includes('[Automatic transcript extraction failed')) {
      console.log('\n❌ EXTRACTION FAILED - got fallback error message');
      return false;
    } else {
      console.log('\n✅ EXTRACTION SUCCESS - got real transcript data!');
      return true;
    }
    
  } catch (error) {
    console.error('\n💥 EXTRACTION ERROR:', error.message);
    console.error('Full error:', error);
    return false;
  }
}

// Run the test
testTranscriptExtraction().then(success => {
  if (success) {
    console.log('\n🎉 READY TO DEPLOY - extraction is working!');
  } else {
    console.log('\n🚫 DO NOT DEPLOY - extraction is broken!');
  }
  process.exit(success ? 0 : 1);
});