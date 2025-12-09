import OomolFusionSDK from '../src/index';

// 从环境变量获取 token
const OOMOL_TOKEN = process.env.OOMOL_TOKEN || '';

if (!OOMOL_TOKEN) {
  console.error('错误: 请设置环境变量 OOMOL_TOKEN');
  console.error('示例: export OOMOL_TOKEN=your-token-here');
  process.exit(1);
}

/**
 * 示例1: Promise 方式(推荐)
 */
async function example1_promise() {
  console.log('=== 示例1: Promise 方式 ===\n');

  const sdk = new OomolFusionSDK({
    token: OOMOL_TOKEN,
  });

  try {
    const result = await sdk.run({
      service: 'fal-nano-banana-pro',
      inputs: {
        prompt: '一只可爱的小猫咪在阳光下打哈欠',
        aspect_ratio: '1:1',
        output_format: 'png',
        resolution: '2K',
      },
    });

    console.log('生成成功！');
    console.log('Session ID:', result.sessionID);
    console.log('Service:', result.service);
    console.log('数据:', result.data);
  } catch (error: any) {
    console.error('生成失败:', error.message);
  }
}

/**
 * 示例2: 调用不同的服务
 */
async function example2_differentService() {
  console.log('\n=== 示例2: 调用不同的服务 ===\n');

  const sdk = new OomolFusionSDK({
    token: OOMOL_TOKEN,
  });

  // 调用 fal-nano-banana-pro 服务
  const result1 = await sdk.run({
    service: 'fal-nano-banana-pro',
    inputs: {
      prompt: '一只小猫',
      aspect_ratio: '1:1',
    },
  });
  console.log('Nano Banana Pro 结果:', result1.data);

  // 未来可以调用其他服务，只需要改变 service 和 inputs
  // const result2 = await sdk.run({
  //   service: 'another-service',
  //   inputs: {
  //     // 不同的参数...
  //   },
  // });
}

/**
 * 示例3: 回调函数方式
 */
function example3_callback() {
  console.log('\n=== 示例3: 回调函数方式 ===\n');

  const sdk = new OomolFusionSDK({
    token: OOMOL_TOKEN,
  });

  sdk.runWithCallback(
    {
      service: 'fal-nano-banana-pro',
      inputs: {
        prompt: '一只小脑斧在森林里奔跑',
        aspect_ratio: '16:9',
      },
    },
    // 成功回调
    (result) => {
      console.log('✅ 生成成功！');
      console.log('Session ID:', result.sessionID);
      console.log('Service:', result.service);
      console.log('数据:', result.data);
    },
    // 错误回调
    (error) => {
      console.error('❌ 生成失败:', error.message);
    },
    // 进度回调
    (progress) => {
      console.log(`📊 进度: ${progress}%`);
    }
  );
}

/**
 * 示例4: 事件监听方式
 */
async function example4_events() {
  console.log('\n=== 示例4: 事件监听方式 ===\n');

  const sdk = new OomolFusionSDK({
    token: OOMOL_TOKEN,
  });

  // 监听进度事件
  sdk.on('progress', (progress) => {
    console.log(`📊 当前进度: ${progress}%`);
  });

  // 监听状态变化事件
  sdk.on('stateChange', ({ sessionID, state, service }) => {
    console.log(`🔄 服务 ${service} 的任务 ${sessionID} 状态变化: ${state}`);
  });

  // 监听成功事件
  sdk.on('success', (result) => {
    console.log('✅ 生成成功！');
    console.log('数据:', result.data);
  });

  // 监听错误事件
  sdk.on('error', (error) => {
    console.error('❌ 发生错误:', error.message);
  });

  try {
    await sdk.run({
      service: 'fal-nano-banana-pro',
      inputs: {
        prompt: '星空下的富士山',
        aspect_ratio: '21:9',
        resolution: '4K',
      },
    });
  } catch (error) {
    // 错误已经通过事件处理
  }
}

/**
 * 示例5: 分离提交和等待
 */
async function example5_submitAndWait() {
  console.log('\n=== 示例5: 分离提交和等待 ===\n');

  const sdk = new OomolFusionSDK({
    token: OOMOL_TOKEN,
  });

  // 仅提交任务
  const { sessionID } = await sdk.submit({
    service: 'fal-nano-banana-pro',
    inputs: {
      prompt: '夕阳下的海滩',
    },
  });

  console.log('任务已提交，Session ID:', sessionID);

  // 可以先做其他事情...
  console.log('做一些其他事情...');
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 稍后再等待结果
  console.log('现在等待结果...');
  const result = await sdk.waitFor('fal-nano-banana-pro', sessionID);

  console.log('生成完成！');
  console.log('数据:', result.data);
}

/**
 * 示例6: 检查任务状态（不等待）
 */
async function example6_checkStatus() {
  console.log('\n=== 示例6: 检查任务状态 ===\n');

  const sdk = new OomolFusionSDK({
    token: OOMOL_TOKEN,
  });

  // 提交任务
  const { sessionID } = await sdk.submit({
    service: 'fal-nano-banana-pro',
    inputs: {
      prompt: '未来城市的科幻场景',
    },
  });

  console.log('任务已提交，Session ID:', sessionID);

  // 手动检查状态（不会自动等待）
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const status = await sdk.getTaskStatus('fal-nano-banana-pro', sessionID);
    console.log(`尝试 ${attempts + 1}: 当前状态 = ${status.state}`);

    if (status.state === 'completed') {
      console.log('✅ 任务完成！');
      console.log('数据:', status.data);
      break;
    } else if (status.state === 'failed' || status.state === 'error') {
      console.error('❌ 任务失败:', status.error);
      break;
    }

    // 等待2秒后再次检查
    await new Promise(resolve => setTimeout(resolve, 2000));
    attempts++;
  }
}

/**
 * 示例7: 批量生成
 */
async function example7_batch() {
  console.log('\n=== 示例7: 批量生成 ===\n');

  const sdk = new OomolFusionSDK({
    token: OOMOL_TOKEN,
  });

  const prompts = [
    '一只小猫',
    '一只小狗',
    '一只小兔子',
  ];

  // 并行提交所有任务
  const submissions = await Promise.all(
    prompts.map(prompt =>
      sdk.submit({
        service: 'fal-nano-banana-pro',
        inputs: { prompt },
      })
    )
  );

  console.log(`已提交 ${submissions.length} 个任务`);

  // 并行等待所有结果
  const results = await Promise.all(
    submissions.map(({ sessionID }) =>
      sdk.waitFor('fal-nano-banana-pro', sessionID)
    )
  );

  console.log('\n所有任务完成！');
  results.forEach((result, index) => {
    console.log(`\n任务 ${index + 1}:`);
    console.log('- Session ID:', result.sessionID);
    console.log('- Service:', result.service);
    console.log('- 数据:', result.data);
  });
}

/**
 * 示例8: 自定义配置
 */
async function example8_customConfig() {
  console.log('\n=== 示例8: 自定义配置 ===\n');

  const sdk = new OomolFusionSDK({
    token: 'your-oomol-token-here',
    baseUrl: 'https://fusion-api.oomol.com/v1', // 自定义API端点
    pollingInterval: 1000, // 1秒轮询一次（更快的反馈）
    timeout: 600000, // 10分钟超时（更长的等待时间）
  });

  const result = await sdk.run({
    service: 'fal-nano-banana-pro',
    inputs: {
      prompt: '复杂的艺术作品，可能需要更长时间',
      resolution: '4K',
    },
  });

  console.log('生成完成！');
  console.log('数据:', result.data);
}

/**
 * 示例9: 使用 TypeScript 类型安全
 */
async function example9_typeSafety() {
  console.log('\n=== 示例9: TypeScript 类型安全 ===\n');

  const sdk = new OomolFusionSDK({
    token: OOMOL_TOKEN,
  });

  // 为特定服务定义类型接口
  interface MyServiceInputs {
    prompt: string;
    aspect_ratio?: '1:1' | '16:9';
    resolution?: '1K' | '2K' | '4K';
  }

  interface MyServiceData {
    images: { url: string }[];
  }

  const inputs: MyServiceInputs = {
    prompt: '一只可爱的小猫',
    aspect_ratio: '1:1',
    resolution: '2K',
  };

  const result = await sdk.run<MyServiceData>({
    service: 'fal-nano-banana-pro',
    inputs,
  });

  // result.data 现在有完整的类型信息
  result.data.images.forEach(image => {
    console.log('图像URL:', image.url);
  });
}

// 运行示例
async function runExamples() {
  console.log('OOMOL Fusion SDK 使用示例\n');
  console.log('请将 "your-oomol-token-here" 替换为您的实际 token\n');
  console.log('========================================\n');

  // 取消下面的注释来运行不同的示例

  // await example1_promise();
  // await example2_differentService();
  // example3_callback();
  // await example4_events();
  // await example5_submitAndWait();
  // await example6_checkStatus();
  // await example7_batch();
  // await example8_customConfig();
  // await example9_typeSafety();
}

// 如果直接运行此文件
if (require.main === module) {
  runExamples().catch(console.error);
}
