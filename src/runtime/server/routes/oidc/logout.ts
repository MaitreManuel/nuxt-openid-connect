import { getCookie, deleteCookie, defineEventHandler } from 'h3'
import { useRuntimeConfig } from '#imports'
import { getCallbackUrl, getDefaultBackUrl, getRedirectUrl, getResponseMode } from '../../../utils/utils';
import { initClient } from '../../../utils/issueclient';

export default defineEventHandler(async (event) => {
  const req = event.node.req
  const res = event.node.res
  console.log('[LOGOUT]: oidc/logout calling')

  const { op, config } = useRuntimeConfig().openidConnect
  const redirectUrl = getRedirectUrl(req.url)
  const defCallBackUrl = getDefaultBackUrl(redirectUrl, req.headers.host)

  deleteCookie(event, config.secret)
  deleteCookie(event, config.cookiePrefix + 'access_token')
  deleteCookie(event, config.cookiePrefix + 'refresh_token')
  deleteCookie(event, config.cookiePrefix + 'user_info')

  const issueClient = await initClient(op, req, [defCallBackUrl])

  const parameters = {
    post_logout_redirect_uri: defCallBackUrl,
  }
  const logoutUrl = issueClient.endSessionUrl(parameters)
  console.log('[Logout]: Logout Url: ' + logoutUrl)

  // delete part of cookie userinfo (depends on user's setting.).
  const cookie = config.cookie
  if (cookie) {
    for (const [key, value] of Object.entries(cookie)) {
      deleteCookie(event, config.cookiePrefix + key)
    }
  }

  res.writeHead(302, { Location: logoutUrl })
  res.end()
})
