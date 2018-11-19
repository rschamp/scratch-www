const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

const elementWrapper = function (elementName) {
    const element = ({
        className,
        children,
        ...componentProps
    }) => (
        React.createElement(elementName, {
            className: classNames(`scratch-${elementName}`, className),
            ...componentProps
        }, children)
    );
    element.displayName = elementName;
    element.propTypes = {
        children: PropTypes.node,
        className: PropTypes.string
    };
    return element;
};

module.exports = [
    'a',

    'dd',
    'dl',
    'dt',

    'h1',
    'h2',
    'h3',
    'h4',
    'h5',

    'p',

    'ol',
    'ul',
    'li'
].reduce((acc, e) => Object.assign(
    acc,
    {[e.toUpperCase()]: elementWrapper(e)}
), {});
