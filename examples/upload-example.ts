/**
 * 文件上传示例
 *
 * 本示例展示如何使用 OOMOL Fusion SDK 上传文件
 */

import OomolFusionSDK from '../src/index';
import fs from 'fs';
import path from 'path';

// 初始化 SDK
const sdk = new OomolFusionSDK({
  token: process.env.OOMOL_TOKEN || 'your-token-here',
});

/**
 * 示例 1: 上传小文件(单文件上传)
 */
async function uploadSmallFile() {
  console.log('=== 示例 1: 上传小文件 ===');

  try {
    // 假设有一个小于 5MB 的文件
    const filePath = path.join(__dirname, 'test-small.jpg');

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.log('测试文件不存在,跳过示例 1');
      return;
    }

    const fileBuffer = fs.readFileSync(filePath);

    const downloadUrl = await sdk.uploadFile(fileBuffer, 'test-small.jpg', {
      onProgress: (progress) => {
        if (typeof progress === 'number') {
          console.log(`上传进度: ${progress}%`);
        }
      }
    });

    console.log('✅ 文件上传成功!');
    console.log('下载链接:', downloadUrl);
  } catch (error) {
    console.error('❌ 上传失败:', error);
  }
}

/**
 * 示例 2: 上传大文件(分段上传)
 */
async function uploadLargeFile() {
  console.log('\n=== 示例 2: 上传大文件 ===');

  try {
    // 假设有一个大于 5MB 的文件
    const filePath = path.join(__dirname, 'test-large.mp4');

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.log('测试文件不存在,跳过示例 2');
      return;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const fileSize = fileBuffer.length;

    console.log(`文件大小: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

    const downloadUrl = await sdk.uploadFile(fileBuffer, 'test-large.mp4', {
      onProgress: (progress) => {
        if (typeof progress === 'number') {
          console.log(`上传进度: ${progress}%`);
        } else {
          console.log(
            `已上传 ${progress.uploadedChunks}/${progress.totalChunks} 分片 ` +
            `(${(progress.uploadedBytes / 1024 / 1024).toFixed(2)}MB / ` +
            `${(progress.totalBytes / 1024 / 1024).toFixed(2)}MB)`
          );
        }
      },
      maxConcurrentUploads: 5, // 并发上传 5 个分片
    });

    console.log('✅ 文件上传成功!');
    console.log('下载链接:', downloadUrl);
  } catch (error) {
    console.error('❌ 上传失败:', error);
  }
}

/**
 * 示例 3: 自定义分段上传阈值
 */
async function uploadWithCustomThreshold() {
  console.log('\n=== 示例 3: 自定义分段上传阈值 ===');

  try {
    const filePath = path.join(__dirname, 'test-medium.pdf');

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.log('测试文件不存在,跳过示例 3');
      return;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const fileSize = fileBuffer.length;

    console.log(`文件大小: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

    // 设置 10MB 为分段上传阈值
    const downloadUrl = await sdk.uploadFile(fileBuffer, 'test-medium.pdf', {
      multipartThreshold: 10 * 1024 * 1024, // 10MB
      onProgress: (progress) => {
        if (typeof progress === 'number') {
          console.log(`上传进度: ${progress}%`);
        } else {
          console.log(`已上传 ${progress.uploadedChunks}/${progress.totalChunks} 分片`);
        }
      },
      retries: 3, // 失败重试 3 次
    });

    console.log('✅ 文件上传成功!');
    console.log('下载链接:', downloadUrl);
  } catch (error) {
    console.error('❌ 上传失败:', error);
  }
}

/**
 * 示例 4: 错误处理
 */
async function uploadWithErrorHandling() {
  console.log('\n=== 示例 4: 错误处理 ===');

  const { FileUploadError, FileTooLargeError } = await import('../src/errors');

  try {
    // 尝试上传一个不存在的文件
    const fileBuffer = Buffer.from([]);

    const downloadUrl = await sdk.uploadFile(fileBuffer, 'empty.txt');

    console.log('下载链接:', downloadUrl);
  } catch (error) {
    if (error instanceof FileTooLargeError) {
      console.error('❌ 文件太大!');
      console.error(`   文件大小: ${(error.fileSize / 1024 / 1024).toFixed(2)} MB`);
      console.error(`   最大限制: ${(error.maxSize / 1024 / 1024).toFixed(2)} MB`);
    } else if (error instanceof FileUploadError) {
      console.error('❌ 上传失败:', error.message);
      if (error.statusCode) {
        console.error(`   状态码: ${error.statusCode}`);
      }
    } else {
      console.error('❌ 未知错误:', error);
    }
  }
}

// 运行所有示例
async function main() {
  console.log('OOMOL Fusion SDK - 文件上传示例\n');

  await uploadSmallFile();
  await uploadLargeFile();
  await uploadWithCustomThreshold();
  await uploadWithErrorHandling();

  console.log('\n所有示例执行完成!');
}

// 执行
if (require.main === module) {
  main().catch(console.error);
}

export { uploadSmallFile, uploadLargeFile, uploadWithCustomThreshold, uploadWithErrorHandling };
