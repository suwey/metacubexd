import { describe, expect, it } from 'vitest'
import { configSaveErrorBody } from '../configSaveError'

describe('configSaveErrorBody', () => {
  it('extracts the kernel error code and detail from a ky HTTPError body', () => {
    const error = Object.assign(
      new Error('Request failed with status code 400'),
      {
        data: {
          error: 'urltest_child_not_found',
          detail:
            "urltest 'auto': child 'typo' not found among configured outbound tags",
        },
      },
    )

    expect(configSaveErrorBody(error)).toEqual({
      code: 'urltest_child_not_found',
      detail:
        "urltest 'auto': child 'typo' not found among configured outbound tags",
    })
  })

  it('keeps an empty detail (code-only bodies stay translatable)', () => {
    expect(
      configSaveErrorBody(
        Object.assign(new Error('Request failed'), {
          data: { error: 'no_config_path' },
        }),
      ),
    ).toEqual({ code: 'no_config_path', detail: '' })
  })

  it('returns null for bodies without the { error } shape', () => {
    expect(configSaveErrorBody(new Error('network down'))).toBeNull()
    expect(configSaveErrorBody({ data: { detail: 'no code' } })).toBeNull()
    expect(configSaveErrorBody({ data: 'plain text body' })).toBeNull()
    expect(configSaveErrorBody(null)).toBeNull()
  })
})
