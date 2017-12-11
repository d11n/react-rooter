import REACT from 'react';

import VALIDATION from './validation';

class React_root_component extends REACT.Component {
    constructor(props) {
        const this_component = super(props);
        // props that are validated by React_root
        // and do not change over the lifecycle of React_root_component:
        // - props.is_app_root
        // - props.dom_element
        // - props.routes
        this_component.state = VALIDATION.ensure_valid_url_params(
            props.is_app_root ? window.location : props,
            ); // eslint-disable-line indent
        this_component.nonexistant_route = this_component.find_route('?')
            || this_component.find_route('404')
            || this_component.find_route(404)
            || null
            ; // eslint-disable-line indent
        return this_component;
    }

    render() {
        const this_component = this;
        const { dom_element, is_app_root } = this_component.props;
        const { url, path, query, fragment } = this_component.state;

        const route = this_component.find_route(path);
        if (route) {
            dom_element.classList.add('react-rooter-routed');
            const route_props = Object.assign(
                route.props,
                { url, path, query, fragment },
                ); // eslint-disable-line indent
            if (is_app_root) {
                document.title
                    = String(route.component.compose_title(route_props))
                    ; // eslint-disable-line indent
            }
            return REACT.createElement(route.component, route.props);
        }

        dom_element.classList.remove('react-rooter-routed');
        dom_element.classList.add('react-rooter-no-route');
        return REACT.createElement(
            `Route not found for "${ path }". And no "?" route is defined.`,
            ); // eslint-disable-line indent
    }

    componentDidMount() {
        const this_component = this;
        if (this_component.props.is_app_root) {
            this_component.on_hashchange = on_hashchange.bind(this_component);
            this_component.on_popstate = on_popstate.bind(this_component);
            window.addEventListener(
                'hashchange', this_component.on_hashchange,
                ); // eslint-disable-line indent
            window.addEventListener(
                'popstate', this_component.on_popstate,
                ); // eslint-disable-line indent
        }
    }

    componentWillUnmount() {
        const this_component = this;
        if (this_component.props.is_app_root) {
            window.removeEventListener(
                'hashchange', this_component.on_hashchange,
                ); // eslint-disable-line indent
            window.removeEventListener(
                'popstate', this_component.on_popstate,
                ); // eslint-disable-line indent
        }
    }
}

// Non-React instance methods (non-enumerable)
Object.defineProperties(React_root_component.prototype, {
    set_path: { value: set_path },
    find_route: { value: find_route },
    }); // eslint-disable-line indent

export default React_root_component;

// -----------

function on_hashchange(hashchange_event) {
    const this_component = this;
    this_component.set_path(hashchange_event.newURL);
    return true;
}

function on_popstate() {
    const this_component = this;
    this_component.set_path(window.location);
    return true;
}

function set_path(params) {
    const this_component = this;
    const current_url = this_component.state.url;
    const new_url_params = VALIDATION.ensure_valid_url_params(params);
    const new_url = new_url_params.url;
    if (current_url.pathname !== new_url.pathname
        || current_url.query !== new_url.query
        || current_url.hash !== new_url.hash
        ) { // eslint-disable-line indent
        this_component.setState(new_url_params);
    }
    return true;
}

function find_route(raw_requested_path) {
    const this_component = this;
    const { routes } = this_component.props;
    const requested_path = VALIDATION.ensure_valid_path(raw_requested_path);
    for (let i = 0, n = routes.length - 1; i <= n; i++) {
        const route = routes[i];
        const { path, pattern, component } = routes[i];
        if (requested_path === path) {
            return { component, props: {} };
        } else if (pattern) {
            const matches = pattern.exec(requested_path);
            if (matches) {
                return {
                    component,
                    props: compose_page_props(route, matches.slice(1)),
                    }; // eslint-disable-line
            }
        }
    }
    return this_component.nonexistant_route || null;
}

function compose_page_props(route, route_pattern_matches) {
    const page_props = { path_params: route_pattern_matches };
    const tokens = route.pattern_tokens;
    if (tokens) {
        for (let i = 0, n = tokens.length - 1; i <= n; i++) {
            const token_name = tokens[i];
            page_props[token_name] = route_pattern_matches[i];
        }
    }
    return page_props;
}
