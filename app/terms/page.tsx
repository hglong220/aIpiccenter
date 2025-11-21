'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
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
                        服务协议
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
                            欢迎您使用AI PIC CENTER！本服务协议（以下简称"本协议"）是您（以下简称"用户"或"您"）与青海立乐科技有限公司（以下简称"我们"或"本公司"）之间就使用AI PIC CENTER平台服务所订立的协议。
                        </p>

                        <div
                            style={{
                                backgroundColor: '#fef3c7',
                                border: '1px solid #fbbf24',
                                borderRadius: '8px',
                                padding: '16px',
                                marginBottom: '24px',
                            }}
                        >
                            <p style={{ margin: 0, fontWeight: 600, color: '#92400e' }}>
                                重要提示：请您在注册成为用户之前，仔细阅读本协议的全部内容，特别是免除或者限制责任的条款。如果您不同意本协议的任何内容，请勿注册或使用本服务。
                            </p>
                        </div>

                        {/* Service Description */}
                        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', marginTop: '32px', marginBottom: '16px' }}>
                            一、服务说明
                        </h2>

                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginTop: '24px', marginBottom: '12px' }}>
                            1.1 服务内容
                        </h3>
                        <p style={{ marginBottom: '16px' }}>
                            AI PIC CENTER是一个基于人工智能技术的图像和视频生成平台，为用户提供AI图像生成、AI视频生成、图像编辑、内容管理等服务。
                        </p>

                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginTop: '24px', marginBottom: '12px' }}>
                            1.2 服务变更
                        </h3>
                        <p style={{ marginBottom: '16px' }}>
                            我们有权根据业务发展需要，对服务内容进行调整、更新或优化。我们会通过网站公告、电子邮箱或其他方式通知您重要的服务变更。
                        </p>

                        {/* Account Registration */}
                        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', marginTop: '32px', marginBottom: '16px' }}>
                            二、账户注册与管理
                        </h2>

                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginTop: '24px', marginBottom: '12px' }}>
                            2.1 注册资格
                        </h3>
                        <p style={{ marginBottom: '16px' }}>
                            您确认，在您完成注册程序或以其他我们允许的方式实际使用本服务时，您应当是具备完全民事权利能力和完全民事行为能力的自然人、法人或其他组织。
                        </p>

                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginTop: '24px', marginBottom: '12px' }}>
                            2.2 账户安全
                        </h3>
                        <p style={{ marginBottom: '16px' }}>
                            您应妥善保管账户信息及密码，对通过您的账户进行的所有活动和事件负法律责任。
                        </p>

                        {/* User Behavior */}
                        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', marginTop: '32px', marginBottom: '16px' }}>
                            三、用户行为规范
                        </h2>

                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginTop: '24px', marginBottom: '12px' }}>
                            3.1 禁止行为
                        </h3>
                        <p style={{ marginBottom: '16px' }}>在使用本服务时，您不得：</p>
                        <ul style={{ marginLeft: '24px', marginBottom: '16px', listStyle: 'disc' }}>
                            <li style={{ marginBottom: '8px' }}>生成、上传、传播违反国家法律法规的内容</li>
                            <li style={{ marginBottom: '8px' }}>生成、传播色情、暴力、恐怖、赌博等违法违规内容</li>
                            <li style={{ marginBottom: '8px' }}>侵犯他人知识产权、肖像权、隐私权等合法权益</li>
                            <li style={{ marginBottom: '8px' }}>批量注册账户或使用自动化工具恶意使用服务</li>
                        </ul>

                        {/* Intellectual Property */}
                        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', marginTop: '32px', marginBottom: '16px' }}>
                            四、知识产权
                        </h2>

                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginTop: '24px', marginBottom: '12px' }}>
                            4.1 平台权利
                        </h3>
                        <p style={{ marginBottom: '16px' }}>
                            本服务包含的所有内容，包括但不限于文字、图片、音频、视频、软件、程序、版面设计等，其知识产权归本公司或相关权利人所有。
                        </p>

                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginTop: '24px', marginBottom: '12px' }}>
                            4.2 用户内容
                        </h3>
                        <p style={{ marginBottom: '16px' }}>
                            您对上传的原始素材保留所有权利，对生成的AI作品享有使用权，可用于个人或商业用途（付费用户）。
                        </p>

                        {/* Paid Services */}
                        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', marginTop: '32px', marginBottom: '16px' }}>
                            五、付费服务
                        </h2>

                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginTop: '24px', marginBottom: '12px' }}>
                            5.1 计费方式
                        </h3>
                        <p style={{ marginBottom: '16px' }}>
                            我们提供多种付费套餐和积分充值方式。具体价格和服务内容以网站公示为准。
                        </p>

                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginTop: '24px', marginBottom: '12px' }}>
                            5.2 退款政策
                        </h3>
                        <p style={{ marginBottom: '16px' }}>
                            由于数字服务的特殊性，除重大故障导致无法使用、重复支付等特殊情况外，已购买的服务和积分不予退款。
                        </p>

                        {/* Disclaimer */}
                        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', marginTop: '32px', marginBottom: '16px' }}>
                            六、免责声明
                        </h2>

                        <p style={{ marginBottom: '16px' }}>
                            我们努力确保服务的稳定性和可靠性，但不对因不可抗力、网络故障、系统维护等原因造成的服务中断承担责任。AI生成的内容可能存在不准确、不完整的情况，您应当自行判断生成内容的质量和适用性。
                        </p>

                        {/* Changes and Termination */}
                        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', marginTop: '32px', marginBottom: '16px' }}>
                            七、协议的变更和终止
                        </h2>

                        <p style={{ marginBottom: '16px' }}>
                            我们有权根据需要修改本协议条款。协议变更后，我们会在网站上公布新的协议。如果您继续使用本服务，即视为您同意变更后的协议。
                        </p>

                        {/* Dispute Resolution */}
                        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', marginTop: '32px', marginBottom: '16px' }}>
                            八、争议解决
                        </h2>

                        <p style={{ marginBottom: '16px' }}>
                            本协议的订立、执行和解释及争议的解决均应适用中华人民共和国法律。如双方就本协议内容或其执行发生任何争议，双方应尽量友好协商解决；协商不成时，任何一方均可向本公司所在地人民法院提起诉讼。
                        </p>

                        {/* Contact */}
                        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', marginTop: '32px', marginBottom: '16px' }}>
                            九、联系方式
                        </h2>

                        <p style={{ marginBottom: '16px' }}>如您对本协议有任何疑问，可通过以下方式联系我们：</p>
                        <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px', marginBottom: '16px' }}>
                            <p style={{ marginBottom: '8px' }}>
                                <strong>公司名称：</strong>青海立乐科技有限公司
                            </p>
                            <p style={{ marginBottom: '8px' }}>
                                <strong>联系邮箱：</strong>support@aipiccenter.com
                            </p>
                            <p style={{ marginBottom: '0' }}>
                                <strong>客服时间：</strong>工作日 9:00-18:00
                            </p>
                        </div>

                        <div
                            style={{
                                backgroundColor: '#e0f2fe',
                                border: '1px solid #0284c7',
                                borderRadius: '8px',
                                padding: '16px',
                                marginTop: '32px',
                            }}
                        >
                            <p style={{ margin: 0, color: '#075985' }}>
                                <strong>再次提醒：</strong>
                                请您仔细阅读本协议的全部条款。您点击"同意"按钮或实际使用本服务，即表示您已充分理解并同意接受本协议的全部内容。
                            </p>
                        </div>
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
