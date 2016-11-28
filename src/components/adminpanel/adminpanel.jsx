var React = require('react');
var connect = require('react-redux').connect;

var Button = require('../forms/button.jsx');

require('./adminpanel.scss');

class AdminPanel extends React.Component{
    constructor (props) {
        super(props);
        this.state = {
            showPanel: false
        };
    }
    handleToggleVisibility (e) {
        e.preventDefault();
        this.setState({showPanel: !this.state.showPanel});
    }
    render () {
        // make sure user is present before checking if they're an admin. Don't show anything if user not an admin.
        var showAdmin = false;
        if (this.props.session.session.user) {
            showAdmin = this.props.session.session.permissions.admin;
        }

        if (!showAdmin) return false;

        if (this.state.showPanel) {
            return (
                <div
                    className="visible"
                    id="admin-panel"
                >
                    <span
                        className="toggle"
                        onClick={this.handleToggleVisibility}
                    >

                        x
                    </span>
                    <div className="admin-header">
                        <h3>Admin Panel</h3>
                    </div>
                    <div className="admin-content">
                        <dl>
                            {this.props.children}
                            <dt>Page Cache</dt>
                            <dd>
                                <ul className="cache-list">
                                    <li>
                                        <form
                                            action="/scratch_admin/page/clear-anon-cache/"
                                            method="post"
                                        >
                                            <input
                                                name="path"
                                                type="hidden"
                                                value="/"
                                            />
                                            <div className="button-row">
                                                <span>For anonymous users:</span>
                                                <Button type="submit">
                                                    <span>Clear</span>
                                                </Button>
                                            </div>
                                        </form>
                                    </li>
                                </ul>
                            </dd>
                        </dl>
                    </div>
                </div>
            );
        }

        return (
            <div
                className="hidden"
                id="admin-panel"
            >
                <span
                    className="toggle"
                    onClick={this.handleToggleVisibility}
                >
                    &gt;
                </span>
            </div>
        );
    }
}

var mapStateToProps = function (state) {
    return {
        session: state.session
    };
};

AdminPanel.propTypes = {
    children: React.PropTypes.node,
    session: React.PropTypes.shape({
        session: React.PropTypes.object
    })
};

var ConnectedAdminPanel = connect(mapStateToProps)(AdminPanel);

module.exports = ConnectedAdminPanel;
