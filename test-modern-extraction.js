const { YoutubeTranscript } = require('@danielxceron/youtube-transcript');

async function testModernExtraction() {
  console.log('🧪 Testing modern transcript extraction with Innertube API...');
  
  const testUrl = 'https://www.youtube.com/watch?v=Hym02GyEI6Q';
  
  try {
    console.log('🚀 Attempting extraction with modern API...');
    const transcriptData = await YoutubeTranscript.fetchTranscript(testUrl);
    
    if (!transcriptData || !Array.isArray(transcriptData) || transcriptData.length === 0) {
      console.log('❌ FAILED - No transcript data returned');
      return false;
    }

    console.log(`✅ SUCCESS! Extracted ${transcriptData.length} transcript segments`);
    console.log('📊 Sample data structure:');
    console.log('First item:', JSON.stringify(transcriptData[0], null, 2));
    
    // Build full transcript
    const fullTranscript = transcriptData.map(item => item.text).join(' ');
    
    console.log('\n📝 FULL TRANSCRIPT PREVIEW (first 1000 chars):');
    console.log('='.repeat(80));
    console.log(fullTranscript.substring(0, 1000));
    console.log('='.repeat(80));
    
    console.log(`\n📈 Total transcript length: ${fullTranscript.length} characters`);
    console.log(`📈 Total segments: ${transcriptData.length}`);
    
    return true;
    
  } catch (error) {
    console.error('💥 EXTRACTION FAILED:', error.message);
    console.error('Full error:', error);
    return false;
  }
}

// Run the test
testModernExtraction().then(success => {
  if (success) {
    console.log('\n🎉 MODERN API WORKS! Ready to deploy!');
  } else {
    console.log('\n🚫 Modern API failed - need to investigate further');
  }
  process.exit(success ? 0 : 1);
});