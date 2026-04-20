const HTML_LIKE_PATTERN = /<\s*!doctype|<\s*html|<\s*body|<\s*head|<\s*title|<\s*div|<\s*span/i

const isHtmlLike = (value) => typeof value === 'string' && HTML_LIKE_PATTERN.test(value)

const extractFirstValue = (value) => {
  if (Array.isArray(value)) {
    return value.length > 0 ? extractFirstValue(value[0]) : null
  }

  if (value && typeof value === 'object') {
    return getApiErrorMessage({ response: { data: value } })
  }

  if (typeof value === 'string') {
    if (isHtmlLike(value)) return null
    return value.trim() ? value.trim() : null
  }

  return null
}

export function getApiErrorMessage(error, fallback = 'Something went wrong') {
  const data = error?.response?.data
  const contentType = error?.response?.headers?.['content-type'] || error?.response?.headers?.['Content-Type'] || ''

  if (!data) {
    if (error?.code === 'ECONNABORTED' || error?.message === 'Network Error') {
      return 'Server not responding. Try again later.'
    }
    return fallback
  }

  if (typeof data === 'string' && (isHtmlLike(data) || /text\/html/i.test(contentType))) {
    return 'Unexpected server error'
  }

  if (typeof data === 'string') {
    return data.trim() || fallback
  }

  if (typeof data.error === 'string') {
    return data.error.trim() || fallback
  }

  if (typeof data.detail === 'string') {
    return data.detail.trim() || fallback
  }

  const fieldKeys = ['email', 'password', 'password2', 'full_name', 'non_field_errors']
  for (const key of fieldKeys) {
    if (data[key]) {
      const message = extractFirstValue(data[key])
      if (message) return message
    }
  }

  for (const value of Object.values(data)) {
    const message = extractFirstValue(value)
    if (message) return message
  }

  return fallback
}