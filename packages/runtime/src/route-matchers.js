const CATCH_ALL_ROUTE = '*'

export function makeRouteMatcher(route) {
    return routeHasParams(route)
        ? makeMatcherWithParams(route)
        : makeMatcherWithoutParams(route)
}

function routeHasParams({ path }) {
    return path.includes(':')
}

function makeMatcherWithParams(route) {
    const regex = makeRouteWithParamsRegex(route)
    const isRedirect = typeof route.redirect === 'string'

    return {
        route,
        isRedirect,
        checkMatch(path) {
            return regex.test(path)
        },
        extractParams(path) {
            const { groups } = regex.exec(path)
            return groups
        },
        extractQuery,
    }
}

function makeRouteWithParamsRegex({ path }) {
    const regex = path.replace(
        /:([^/]+)/g,
        (_, paramName) => `(?<${paramName}>[^/]+)`
    )

    return new RegExp(`^${regex}$`)
}

function makeMatcherWithoutParams(route) {
    const regex = makeRouteWithoutParamsRegex(route)
    const isRedirect = typeof route.redirect === 'string'

    return {
        route,
        isRedirect,
        checkMatch(path) {
            return regex.test(path)
        },
        extractParams() {
            return {}
        },
        extractQuery,
    }
}

function makeRouteWithoutParamsRegex({ path }) {
    if (path === CATCH_ALL_ROUTE) {
        return new RegExp('^.*$')
    }

    return new RegExp(`^${path}$`)
}

function extractQuery(path) {
    const queryIndex = path.indexOf('?')

    if (queryIndex === -1) {
        return {}
    }

    const search = new URLSearchParams(path.slice(queryIndex + 1))

    return Object.fromEntries(search.entries())
}