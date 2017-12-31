import REACT from 'react';
import Url, { qs as URL_QUERY } from 'url-parse';

export default {
    ensure_valid_routes,
    ensure_valid_url_params,
    ensure_valid_path,
    }; // eslint-disable-line indent

// -----------

function ensure_valid_routes(raw_routes) {
    !Array.isArray(raw_routes)
        ? throw_type_error('routes must be an array')
        : 0 === raw_routes.length
            && throw_error('There are no routes defined')
        ; // eslint-disable-line indent
    const routes = [];
    for (let i = 0, n = raw_routes.length - 1; i <= n; i++) {
        const raw_route = raw_routes[i];
        raw_route.path
            ? raw_route.pattern || raw_route.pattern_tokens
                ? throw_error(
                    'If route.path is defined,',
                    'route.pattern and route.pattern_tokens are invalid',
                    ) // eslint-disable-line indent
                : 'string' !== typeof raw_route.path
                    && throw_type_error('route.path must be a string')
            : raw_route.pattern
                ? !(raw_route.pattern instanceof RegExp)
                    && throw_type_error(
                        'route.pattern must be a regular expression',
                        ) // eslint-disable-line indent
                : throw_type_error(
                    'route.path must be a string',
                    'or route.pattern must be regular expression',
                    ) // eslint-disable-line indent
            ; // eslint-disable-line indent
        raw_route.redirect_to
            ? 'string' !== typeof raw_route.redirect_to
                ? throw_type_error('route.redirect_to must be a string')
                : raw_route.component
                    && throw_error(
                        'If route.redirect_to is defined,',
                        'route.component is invalid',
                        ) // eslint-disable-line indent
            : !(raw_route.component.prototype instanceof REACT.Component)
                && throw_type_error('route.component must be a React Component')
            ; // eslint-disable-line indent
        routes.push({
            path: raw_route.path ? ensure_valid_path(raw_route.path) : null,
            pattern: raw_route.pattern || null,
            pattern_tokens:
                ensure_valid_pattern_tokens(raw_route.pattern_tokens)
                , // eslint-disable-line
            redirect_to: raw_route.redirect_to || null,
            component: raw_route.component,
            }); // eslint-disable-line indent
    }
    return routes;
}

function ensure_valid_pattern_tokens(raw_pattern_tokens) {
    if (undefined === raw_pattern_tokens || null === raw_pattern_tokens) {
        return null;
    }
    !Array.isArray(raw_pattern_tokens)
        && throw_type_error('pattern_tokens must be an array')
        ; // eslint-disable-line indent
    return raw_pattern_tokens.map(ensure_string);

    // -----------

    function ensure_string(value) {
        'string' !== typeof value
            && throw_type_error(
                `pattern_tokens must be strings. ${ value } is not a string`,
                ) // eslint-disable-line indent
            ; // eslint-disable-line indent
        return value;
    }
}

function ensure_valid_url_params(params) {
    if (undefined === params
        || null === params
        || '' === params
        || '/' === params
        ) { // eslint-disable-line indent
        return {
            url: new Url('/'),
            path: '/',
            query: {},
            fragment: null,
            }; // eslint-disable-line indent
    } else if ('string' === typeof params
        || params instanceof Location
        || params instanceof HTMLAnchorElement
        ) { // eslint-disable-line indent
        return compose_valid_url_data_from_parsable_value(params);
    } else if ('object' === typeof params && !Array.isArray(params)) {
        if (params.path || params.query || params.fragment) {
            const path = ensure_valid_path(params.path);
            const query = ensure_valid_query(params.query);
            const query_string = URL_QUERY.stringify(query);
            const fragment = ensure_valid_fragment(params.fragment);
            const url = new Url([
                path,
                query_string ? `?${ query_string }` : '',
                fragment ? `#${ fragment }` : '',
                ].join('')); // eslint-disable-line indent
            return { url, path, query, fragment };
        }
        return throw_error(
            'path, query, or fragment',
            'must be provided in order to compose valid url data',
            ); // eslint-disable-line indent
    }
    return throw_error(`${ params } cannot be used to compose valid url data`);

    // -----------

    function compose_valid_url_data_from_parsable_value(parsable_value) {
        const url = new Url(parsable_value);
        return {
            url,
            path: ensure_valid_path(url.pathname),
            query: ensure_valid_query(url.query),
            fragment: ensure_valid_fragment(url.hash),
            }; // eslint-disable-line indent
    }
}

function ensure_valid_path(raw_path) {
    if (undefined === raw_path
        || null === raw_path
        || '' === raw_path
        || '/' === raw_path
        ) { // eslint-disable-line indent
        return '/';
    } else if ('?' === raw_path || 404 === raw_path || '404' === raw_path) {
        return raw_path; // special paths that are returned if unresolvable
    } else if ('string' === typeof raw_path) {
        // eslint-disable-next-line prefer-template
        return '/' + raw_path
            .split('/').filter(Boolean).join('/')
            // ^ trims leading, trailing, and repeated slashes
            .toLowerCase()
            ; // eslint-disable-line indent
    }
    return throw_type_error('path must be either a string or the number 404');
}

function ensure_valid_query(raw_query) {
    if (undefined === raw_query
        || null === raw_query
        || '' === raw_query
        || '?' === raw_query
        ) { // eslint-disable-line indent
        return {};
    } else if ('string' === typeof raw_query) {
        return URL_QUERY.parse(raw_query);
    } else if ('object' === typeof raw_query) {
        return raw_query;
    }
    return throw_error(`${ raw_query } cannot be converted to a url query`);
}

function ensure_valid_fragment(raw_fragment) {
    if (undefined === raw_fragment
        || null === raw_fragment
        || '' === raw_fragment
        || '#' === raw_fragment
        ) { // eslint-disable-line indent
        return null;
    } else if ('string' === typeof raw_fragment) {
        const fragment = '#' === raw_fragment.substr(0, 1)
            ? raw_fragment.substr(1)
            : raw_fragment
            ; // eslint-disable-line indent
        const is_fragment_encoded = fragment !== decodeURIComponent(fragment);
        return is_fragment_encoded ? fragment : encodeURIComponent(fragment);
    }
    return throw_error(
        `${ raw_fragment } cannot be converted to a url fragment`,
        ); // eslint-disable-line indent
}

// -----------

function throw_error(...error_message) {
    throw new Error(format_error_message(error_message));
}
function throw_type_error(...error_message) {
    throw new TypeError(format_error_message(error_message));
}
function format_error_message(error_message) {
    return error_message.map(String).join(' ');
}
