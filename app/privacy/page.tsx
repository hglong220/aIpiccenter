'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', paddingBottom: '80px' }}>
            {/* Header */}
            <header
                style={{
                    backgroundColor: '#ffffff',
                    borderBottom: '1px solid #e5e7eb',
                    padding: '16px 0',
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                }}
            >
                <div
                    style={{
                        maxWidth: '1200px',
                        margin: '0 auto',
                        padding: '0 24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                    }}
                >
                    <Link
                        href="/"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#6b7280',
                            textDecoration: 'none',
                            fontSize: '14px',
                            fontWeight: 500,
                        }}
                    >
                        <ArrowLeft style={{ width: '18px', height: '18px' }} />
                        返回首页
                    </Link>
                </div>
            </header>

            {/* Content */}
            <main
                style={{
                    maxWidth: '900px',
                    margin: '0 auto',
                    padding: '48px 24px',
                }}
            >
                <article
                    style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '16px',
                        padding: '48px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    }}
                >
                    <h1
                        style={{
                            fontSize: '32px',
                            fontWeight: 700,
                            color: '#111827',
                            marginBottom: '8px',
                        }}
                    >
                        隐私政策
                    </h1>
                    <p
                        style={{
                            fontSize: '14px',
                            color: '#6b7280',
                            marginBottom: '32px',
                        }}
                    >
                        最后更新日期：2025年11月21日
                    </p>

                    <div style={{ fontSize: '15px', lineHeight: '1.8', color: '#374151' }}>
                        <p style={{ marginBottom: '24px' }}>
                            青海立乐科技有限公司（以下简称"我们"）深知个人信息对您的重要性，并会尽力保护您的个人信息安全可靠。我们致力于维持您对我们的信任，恪守以下原则，保护您的个人信息：权责一致原则、目的明确原则、选择同意原则、最少够用原则、确保安全原则、主体参与原则、公开透明原则等。同时，我们承诺，我们将按业界成熟的安全标准，采取相应的安全保护措施来保护您的个人信息。
                        </p>

                        <h2
                            style={{
                                fontSize: '20px',
                                fontWeight: 600,
                                color: '#111827',
                                marginTop: '32px',
                                marginBottom: '16px',
                            }}
                        >
                            一、我们如何收集和使用您的个人信息
                        </h2>

                        <h3
                            style={{
                                fontSize: '16px',
                                fontWeight: 600,
                                color: '#111827',
                                marginTop: '24px',
                                marginBottom: '12px',
                            }}
                        >
                            1.1 注册账户
                        </h3>
                        <p style={{ marginBottom: '16px' }}>
                            当您注册AI PIC CENTER账户时，我们会收集您的手机号码、电子邮箱地址等信息，以便创建您的账户并为您提供服务。
                        </p>

                        <h3
                            style={{
                                fontSize: '16px',
                                fontWeight: 600,
                                color: '#111827',
                                marginTop: '24px',
                                marginBottom: '12px',
                            }}
                        >
                            1.2 使用服务
                        </h3>
                        <p style={{ marginBottom: '16px' }}>
                            在您使用我们的AI图像和视频生成服务时，我们会收集：
                        </p>
                        <ul
                            style={{
                                marginLeft: '24px',
                                marginBottom: '16px',
                                listStyle: 'disc',
                            }}
                        >
                            <li style={{ marginBottom: '8px' }}>您输入的文本提示词、上传的参考图片等内容</li>
                            <li style={{ marginBottom: '8px' }}>生成的AI作品及相关元数据</li>
                            <li style={{ marginBottom: '8px' }}>使用日志，包括使用时间、功能选择、生成参数等</li>
                            <li style={{ marginBottom: '8px' }}>设备信息，包括设备型号、操作系统版本、浏览器类型等</li>
                        </ul>

                        <h3
                            style={{
                                fontSize: '16px',
                                fontWeight: 600,
                                color: '#111827',
                                marginTop: '24px',
                                marginBottom: '12px',
                            }}
                        >
                            1.3 支付服务
                        </h3>
                        <p style={{ marginBottom: '16px' }}>
                            当您购买我们的付费服务时，我们会收集支付相关信息，包括订单信息、支付方式等。实际的支付操作由第三方支付机构完成，我们不会收集或存储您的银行卡号、密码等敏感支付信息。
                        </p>

                        <h2
                            style={{
                                fontSize: '20px',
                                fontWeight: 600,
                                color: '#111827',
                                marginTop: '32px',
                                marginBottom: '16px',
                            }}
                        >
                            二、我们如何使用Cookie和同类技术
                        </h2>
                        <p style={{ marginBottom: '16px' }}>
                            为确保网站正常运转、为您获得更轻松的访问体验、向您推荐您可能感兴趣的内容，我们会在您的计算机或移动设备上存储Cookie、Flash Cookie，或您的浏览器或关联应用程序提供的其他通常包含标识符、站点名称以及一些号码和字符的本地存储（统称"Cookie"）。
                        </p>

                        <h2
                            style={{
                                fontSize: '20px',
                                fontWeight: 600,
                                color: '#111827',
                                marginTop: '32px',
                                marginBottom: '16px',
                            }}
                        >
                            三、我们如何共享、转让、公开披露您的个人信息
                        </h2>

                        <h3
                            style={{
                                fontSize: '16px',
                                fontWeight: 600,
                                color: '#111827',
                                marginTop: '24px',
                                marginBottom: '12px',
                            }}
                        >
                            3.1 共享
                        </h3>
                        <p style={{ marginBottom: '16px' }}>
                            我们会与第三方公司、组织和个人共享您的个人信息，但以下情况除外：
                        </p>
                        <ul
                            style={{
                                marginLeft: '24px',
                                marginBottom: '16px',
                                listStyle: 'disc',
                            }}
                        >
                            <li style={{ marginBottom: '8px' }}>在获取明确同意的情况下共享</li>
                            <li style={{ marginBottom: '8px' }}>与我们的关联公司共享，用于提供一致化服务</li>
                            <li style={{ marginBottom: '8px' }}>与授权合作伙伴共享，如支付服务商、云服务提供商等</li>
                            <li style={{ marginBottom: '8px' }}>根据法律法规规定、诉讼争议解决需要，或按行政、司法机关依法提出的要求</li>
                        </ul>

                        <h3
                            style={{
                                fontSize: '16px',
                                fontWeight: 600,
                                color: '#111827',
                                marginTop: '24px',
                                marginBottom: '12px',
                            }}
                        >
                            3.2 转让
                        </h3>
                        <p style={{ marginBottom: '16px' }}>
                            我们不会将您的个人信息转让给任何公司、组织和个人，但以下情况除外：在获得您的明确同意后；在涉及合并、收购或破产清算时，如涉及到个人信息转让，我们会向您告知有关情况。
                        </p>

                        <h3
                            style={{
                                fontSize: '16px',
                                fontWeight: 600,
                                color: '#111827',
                                marginTop: '24px',
                                marginBottom: '12px',
                            }}
                        >
                            3.3 公开披露
                        </h3>
                        <p style={{ marginBottom: '16px' }}>
                            我们仅会在以下情况下，公开披露您的个人信息：获得您明确同意后；基于法律的披露。
                        </p>

                        <h2
                            style={{
                                fontSize: '20px',
                                fontWeight: 600,
                                color: '#111827',
                                marginTop: '32px',
                                marginBottom: '16px',
                            }}
                        >
                            四、我们如何保护您的个人信息
                        </h2>
                        <p style={{ marginBottom: '16px' }}>
                            我们已使用符合业界标准的安全防护措施保护您提供的个人信息，防止数据遭到未经授权访问、公开披露、使用、修改、损坏或丢失。我们会采取一切合理可行的措施，保护您的个人信息：
                        </p>
                        <ul
                            style={{
                                marginLeft: '24px',
                                marginBottom: '16px',
                                listStyle: 'disc',
                            }}
                        >
                            <li style={{ marginBottom: '8px' }}>数据传输采用SSL加密技术</li>
                            <li style={{ marginBottom: '8px' }}>对个人信息进行去标识化或匿名化处理</li>
                            <li style={{ marginBottom: '8px' }}>建立严格的数据访问权限控制和审计机制</li>
                            <li style={{ marginBottom: '8px' }}>定期进行安全评估和渗透测试</li>
                        </ul>

                        <h2
                            style={{
                                fontSize: '20px',
                                fontWeight: 600,
                                color: '#111827',
                                marginTop: '32px',
                                marginBottom: '16px',
                            }}
                        >
                            五、您的权利
                        </h2>
                        <p style={{ marginBottom: '16px' }}>
                            按照中国相关的法律、法规、标准，以及其他国家、地区的通行做法，我们保障您对自己的个人信息行使以下权利：
                        </p>
                        <ul
                            style={{
                                marginLeft: '24px',
                                marginBottom: '16px',
                                listStyle: 'disc',
                            }}
                        >
                            <li style={{ marginBottom: '8px' }}>访问您的个人信息</li>
                            <li style={{ marginBottom: '8px' }}>更正您的个人信息</li>
                            <li style={{ marginBottom: '8px' }}>删除您的个人信息</li>
                            <li style={{ marginBottom: '8px' }}>撤回同意</li>
                            <li style={{ marginBottom: '8px' }}>注销账户</li>
                            <li style={{ marginBottom: '8px' }}>获取个人信息副本</li>
                        </ul>

                        <h2
                            style={{
                                fontSize: '20px',
                                fontWeight: 600,
                                color: '#111827',
                                marginTop: '32px',
                                marginBottom: '16px',
                            }}
                        >
                            六、未成年人的个人信息保护
                        </h2>
                        <p style={{ marginBottom: '16px' }}>
                            我们非常重视对未成年人个人信息的保护。若您是18周岁以下的未成年人，在使用我们的产品和/或服务前，应事先取得您家长或法定监护人的同意。我们根据国家相关法律法规的规定保护未成年人的个人信息。
                        </p>

                        <h2
                            style={{
                                fontSize: '20px',
                                fontWeight: 600,
                                color: '#111827',
                                marginTop: '32px',
                                marginBottom: '16px',
                            }}
                        >
                            七、本隐私政策如何更新
                        </h2>
                        <p style={{ marginBottom: '16px' }}>
                            我们的隐私政策可能变更。未经您明确同意，我们不会削减您按照本隐私政策所应享有的权利。我们会在本页面上发布对本政策所做的任何变更。对于重大变更，我们还会提供更为显著的通知（包括对于某些服务，我们会通过电子邮件发送通知，说明隐私政策的具体变更内容）。
                        </p>

                        <h2
                            style={{
                                fontSize: '20px',
                                fontWeight: 600,
                                color: '#111827',
                                marginTop: '32px',
                                marginBottom: '16px',
                            }}
                        >
                            八、如何联系我们
                        </h2>
                        <p style={{ marginBottom: '16px' }}>
                            如果您对本隐私政策有任何疑问、意见或建议，通过以下方式与我们联系：
                        </p>
                        <div
                            style={{
                                backgroundColor: '#f9fafb',
                                padding: '20px',
                                borderRadius: '8px',
                                marginBottom: '16px',
                            }}
                        >
                            <p style={{ marginBottom: '8px' }}>
                                <strong>公司名称：</strong>青海立乐科技有限公司
                            </p>
                            <p style={{ marginBottom: '8px' }}>
                                <strong>联系邮箱：</strong>privacy@aipiccenter.com
                            </p>
                            <p style={{ marginBottom: '0' }}>
                                <strong>联系地址：</strong>青海省
                            </p>
                        </div>
                        <p style={{ marginBottom: '16px' }}>
                            一般情况下，我们将在15天内回复。如果您对我们的回复不满意，特别是我们的个人信息处理行为损害了您的合法权益，您还可以向网信、电信、公安及工商等监管部门进行投诉或举报。
                        </p>
                    </div>
                </article>
            </main>

            {/* Footer */}
            <footer
                style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.92)',
                    backdropFilter: 'blur(8px)',
                    borderTop: '1px solid rgba(229, 231, 235, 0.8)',
                    zIndex: 120,
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '56px',
                        padding: '12px 16px',
                        fontSize: '12px',
                        color: '#6b7280',
                    }}
                >
                    <span>© 2025 AI Pic Center. All rights reserved.</span>
                </div>
            </footer>
        </div>
    )
}
