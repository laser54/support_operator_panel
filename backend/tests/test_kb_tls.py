import ssl
import unittest

from app.services.knowledge_base import KnowledgeBaseService, kb_service


class KnowledgeBaseTLSVerificationTest(unittest.IsolatedAsyncioTestCase):
    async def test_outbound_qa_client_requires_trusted_tls_certificate(self):
        client = KnowledgeBaseService().client
        try:
            context = client._transport._pool._ssl_context
            self.assertEqual(context.verify_mode, ssl.CERT_REQUIRED)
            self.assertTrue(context.check_hostname)
        finally:
            await client.aclose()
            await kb_service.client.aclose()


if __name__ == '__main__':
    unittest.main()
