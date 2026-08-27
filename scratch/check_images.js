import fs from 'fs';

function checkICO(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.length < 6) {
    console.log(`${filePath} is too small to be a valid ICO file.`);
    return;
  }
  const reserved = buffer.readUInt16LE(0);
  const type = buffer.readUInt16LE(2);
  const count = buffer.readUInt16LE(4);
  console.log(`ICO: reserved=${reserved}, type=${type} (should be 1), imageCount=${count}`);
  
  if (count > 0 && buffer.length >= 6 + 16) {
    const width = buffer.readUInt8(6) || 256;
    const height = buffer.readUInt8(7) || 256;
    const colors = buffer.readUInt8(8);
    console.log(`First image: ${width}x${height}, colors=${colors}`);
  }
}

function checkPNG(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.length < 8) {
    console.log(`${filePath} is too small to be a valid PNG file.`);
    return;
  }
  const signature = buffer.toString('hex', 0, 8);
  console.log(`PNG: signature=${signature} (should be 89504e470d0a1a0a)`);
  if (signature === '89504e470d0a1a0a') {
    // Find IHDR chunk
    let offset = 8;
    while (offset < buffer.length) {
      const length = buffer.readUInt32BE(offset);
      const chunkType = buffer.toString('ascii', offset + 4, offset + 8);
      if (chunkType === 'IHDR') {
        const width = buffer.readUInt32BE(offset + 8);
        const height = buffer.readUInt32BE(offset + 12);
        console.log(`PNG IHDR: ${width}x${height}`);
        break;
      }
      offset += 12 + length;
    }
  }
}

console.log('--- public/favicon.ico ---');
checkICO('public/favicon.ico');
console.log('--- public/favicon.png ---');
checkPNG('public/favicon.png');
