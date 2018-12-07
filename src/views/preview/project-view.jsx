// preview view can show either project page or editor page;
// idea is that we shouldn't require a page reload to switch back and forth

const bindAll = require('lodash.bindall');
const React = require('react');
const PropTypes = require('prop-types');
const connect = require('react-redux').connect;
const injectIntl = require('react-intl').injectIntl;
const parser = require('scratch-parser');
const copy = require('clipboard-copy');

const Page = require('../../components/page/www/page.jsx');
const storage = require('../../lib/storage.js').default;
const log = require('../../lib/log');
const EXTENSION_INFO = require('../../lib/extensions.js').default;
const jar = require('../../lib/jar.js');
const thumbnailUrl = require('../../lib/user-thumbnail');

const PreviewPresentation = require('./presentation.jsx');
const projectShape = require('./projectshape.jsx').projectShape;
const Registration = require('../../components/registration/registration.jsx');
const ConnectedLogin = require('../../components/login/connected-login.jsx');
const CanceledDeletionModal = require('../../components/login/canceled-deletion-modal.jsx');
const NotAvailable = require('../../components/not-available/not-available.jsx');

const sessionActions = require('../../redux/session.js');
const navigationActions = require('../../redux/navigation.js');
const previewActions = require('../../redux/preview.js');

const frameless = require('../../lib/frameless');

const GUI = require('scratch-gui');
const IntlGUI = injectIntl(GUI.default);

const localStorageAvailable = 'localStorage' in window && window.localStorage !== null;

class Preview extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'addEventListeners',
            'fetchCommunityData',
            'handleAddComment',
            'handleCopyProjectLink',
            'handleDeleteComment',
            'handleToggleStudio',
            'handleFavoriteToggle',
            'handleLoadMore',
            'handleLoveToggle',
            'handleMessage',
            'handlePopState',
            'handleCloseAdminPanel',
            'handleIsRemixing',
            'handleOpenAdminPanel',
            'handleReportClick',
            'handleReportClose',
            'handleReportComment',
            'handleReportSubmit',
            'handleRestoreComment',
            'handleAddToStudioClick',
            'handleAddToStudioClose',
            'handleRemix',
            'handleSeeAllComments',
            'handleSeeInside',
            'handleShare',
            'handleUpdateProjectId',
            'handleUpdateProjectTitle',
            'handleUpdate',
            'handleToggleComments',
            'initCounts',
            'pushHistory',
            'renderLogin',
            'setScreenFromOrientation'
        ]);
        const pathname = window.location.pathname.toLowerCase();
        const parts = pathname.split('/').filter(Boolean);
        // parts[0]: 'projects'
        // parts[1]: either :id or 'editor', invalid if neither specified
        // parts[2]: undefined if no :id, otherwise either 'editor' or 'fullscreen'

        // Get single-comment id from url hash, using the #comments-{id} scheme from scratch2
        const commentHashPrefix = '#comments-';
        const singleCommentId = window.location.hash.indexOf(commentHashPrefix) !== -1 &&
            parseInt(window.location.hash.replace(commentHashPrefix, ''), 10);

        const adminPanelOpen = localStorageAvailable && localStorage.getItem('adminPanelToggled_projects') === 'open';

        this.state = {
            addToStudioOpen: false,
            adminModalOpen: false,
            adminPanelOpen: adminPanelOpen || false,
            extensions: [],
            favoriteCount: 0,
            isRemixing: false,
            invalidProject: parts.length === 1,
            justRemixed: false,
            justShared: false,
            loveCount: 0,
            modInfo: {
                scripts: 0,
                sprites: 0
            },
            projectId: parts[1] === 'editor' ? '0' : parts[1],
            reportOpen: false,
            singleCommentId: singleCommentId
        };
        /* In the beginning, if user is on mobile and landscape, go to fullscreen */
        this.setScreenFromOrientation();
    }
    componentDidMount () {
        this.addEventListeners();
    }
    componentDidUpdate (prevProps, prevState) {
        if (this.state.projectId > 0 &&
            ((this.props.sessionStatus !== prevProps.sessionStatus &&
            this.props.sessionStatus === sessionActions.Status.FETCHED) ||
            (this.state.projectId !== prevState.projectId))) {
            this.fetchCommunityData();
            this.getProjectData(this.state.projectId);
            if (this.state.justShared) {
                this.setState({ // eslint-disable-line react/no-did-update-set-state
                    justShared: false
                });
            }
        }
        if (this.state.projectId === '0' && this.state.projectId !== prevState.projectId) {
            this.props.resetProject();
            if (this.state.justRemixed || this.state.justShared) {
                this.setState({ // eslint-disable-line react/no-did-update-set-state
                    justRemixed: false,
                    justShared: false
                });
            }
        }
        if (this.props.projectInfo.id !== prevProps.projectInfo.id) {
            if (typeof this.props.projectInfo.id === 'undefined') {
                this.initCounts(0, 0);
            } else {
                this.initCounts(this.props.projectInfo.stats.favorites, this.props.projectInfo.stats.loves);
                if (this.props.projectInfo.remix.parent !== null) {
                    this.props.getParentInfo(this.props.projectInfo.remix.parent);
                }
                if (this.props.projectInfo.remix.root !== null &&
                    this.props.projectInfo.remix.root !== this.props.projectInfo.remix.parent
                ) {
                    this.props.getOriginalInfo(this.props.projectInfo.remix.root);
                }
            }
        }
        if (this.props.playerMode !== prevProps.playerMode || this.props.fullScreen !== prevProps.fullScreen) {
            this.pushHistory(history.state === null);
        }

        // Switching out of editor mode, refresh data that comes from project json
        if (this.props.playerMode && !prevProps.playerMode) {
            this.getProjectData(this.state.projectId);
        }
    }
    componentWillUnmount () {
        this.removeEventListeners();
    }
    addEventListeners () {
        window.addEventListener('popstate', this.handlePopState);
        window.addEventListener('orientationchange', this.setScreenFromOrientation);
        window.addEventListener('message', this.handleMessage);
    }
    removeEventListeners () {
        window.removeEventListener('popstate', this.handlePopState);
        window.removeEventListener('orientationchange', this.setScreenFromOrientation);
        window.removeEventListener('message', this.handleMessage);
    }
    fetchCommunityData () {
        if (this.props.userPresent) {
            const username = this.props.user.username;
            const token = this.props.user.token;
            if (this.state.singleCommentId) {
                this.props.getCommentById(this.state.projectId, this.state.singleCommentId,
                    this.props.isAdmin, token);
            } else {
                this.props.getTopLevelComments(this.state.projectId, this.props.comments.length,
                    this.props.isAdmin, token);
            }
            this.props.getProjectInfo(this.state.projectId, token);
            this.props.getRemixes(this.state.projectId, token);
            this.props.getProjectStudios(this.state.projectId, token);
            this.props.getCuratedStudios(username);
            this.props.getFavedStatus(this.state.projectId, username, token);
            this.props.getLovedStatus(this.state.projectId, username, token);
        } else {
            if (this.state.singleCommentId) {
                this.props.getCommentById(this.state.projectId, this.state.singleCommentId);
            } else {
                this.props.getTopLevelComments(this.state.projectId, this.props.comments.length);
            }
            this.props.getProjectInfo(this.state.projectId);
            this.props.getRemixes(this.state.projectId);
            this.props.getProjectStudios(this.state.projectId);
        }
    }
    setScreenFromOrientation () {
        /*
        * If the user is on a mobile device, switching to
        * landscape format should make the fullscreen mode active
        */
        const isMobileDevice = screen.height <= frameless.mobile || screen.width <= frameless.mobile;
        const isAModalOpen = this.state.addToStudioOpen || this.state.reportOpen;
        if (this.props.playerMode && isMobileDevice && !isAModalOpen) {
            const isLandscape = screen.height < screen.width;
            if (isLandscape) {
                this.props.setFullScreen(true);
            } else {
                this.props.setFullScreen(false);
            }
        }
    }
    getProjectData (projectId) {
        if (projectId > 0) {
            storage
                .load(storage.AssetType.Project, projectId, storage.DataFormat.JSON)
                .then(projectAsset => { // NOTE: this is turning up null, breaking the line below.
                    let input = projectAsset.data;
                    if (typeof input === 'object' && !(input instanceof ArrayBuffer) &&
                    !ArrayBuffer.isView(input)) { // taken from scratch-vm
                        // If the input is an object and not any ArrayBuffer
                        // or an ArrayBuffer view (this includes all typed arrays and DataViews)
                        // turn the object into a JSON string, because we suspect
                        // this is a project.json as an object
                        // validate expects a string or buffer as input
                        // TODO not sure if we need to check that it also isn't a data view
                        input = JSON.stringify(input);
                    }
                    parser(projectAsset.data, false, (err, projectData) => {
                        if (err) {
                            log.error(`Unhandled project parsing error: ${err}`);
                            return;
                        }
                        const extensionSet = new Set();
                        if (projectData[0].extensions) {
                            projectData[0].extensions.forEach(extension => {
                                const extensionInfo = EXTENSION_INFO[extension];
                                if (extensionInfo) {
                                    extensionSet.add(extensionInfo);
                                }
                            });
                        }
                        const sprites = projectData[0].targets.length - 1; // don't count stage
                        const scripts = projectData[0].targets
                            .map(target =>
                                Object.values(target.blocks)
                                    .filter(block => block.topLevel).length
                            )
                            .reduce((accumulator, currentVal) => accumulator + currentVal, 0);
                        this.setState({
                            extensions: Array.from(extensionSet),
                            modInfo: {
                                scripts: scripts,
                                sprites: sprites
                            }
                        });
                    });
                });
        } else { // projectId is default or invalid; empty the extensions array
            this.setState({
                extensions: [],
                modInfo: {
                    scripts: 0,
                    sprites: 0
                }
            });
        }
    }
    handleToggleComments () {
        this.props.updateProject(
            this.props.projectInfo.id,
            {comments_allowed: !this.props.projectInfo.comments_allowed},
            this.props.user.username,
            this.props.user.token
        );
    }
    handleIsRemixing (isRemixing) {
        if (this.state.isRemixing !== isRemixing) {
            this.setState({isRemixing: isRemixing});
            if (isRemixing === false) { // just finished remixing
                this.setState({
                    justRemixed: true,
                    justShared: false
                });
            }
        }
    }
    handleAddComment (comment, topLevelCommentId) {
        this.props.handleAddComment(comment, topLevelCommentId);
    }
    handleDeleteComment (id, topLevelCommentId) {
        this.props.handleDeleteComment(this.state.projectId, id, topLevelCommentId, this.props.user.token);
    }
    handleCloseAdminPanel () {
        this.setState({adminPanelOpen: false});
        if (localStorageAvailable) {
            localStorage.setItem('adminPanelToggled_projects', 'closed');
        }
    }
    handleOpenAdminPanel () {
        this.setState({adminPanelOpen: true});
        if (localStorageAvailable) {
            localStorage.setItem('adminPanelToggled_projects', 'open');
        }
    }
    handleMessage (messageEvent) {
        if (messageEvent.data === 'showDialog') {
            this.setState({
                adminModalOpen: true
            });
        }
        if (messageEvent.data === 'hideDialog') {
            this.setState({
                adminModalOpen: false
            });
        }
        if (messageEvent.data === 'openPanel') this.handleOpenAdminPanel();
        if (messageEvent.data === 'closePanel') this.handleCloseAdminPanel();
    }
    handleReportComment (id, topLevelCommentId) {
        this.props.handleReportComment(this.state.projectId, id, topLevelCommentId, this.props.user.token);
    }
    handleRestoreComment (id, topLevelCommentId) {
        this.props.handleRestoreComment(this.state.projectId, id, topLevelCommentId, this.props.user.token);
    }
    handleReportClick () {
        this.setState({reportOpen: true});
    }
    handleReportClose () {
        this.setState({reportOpen: false});
    }
    handleAddToStudioClick () {
        this.setState({addToStudioOpen: true});
    }
    handleAddToStudioClose () {
        this.setState({addToStudioOpen: false});
    }
    handleReportSubmit (formData) {
        this.props.reportProject(this.state.projectId, formData, this.props.user.token);
    }
    handlePopState () {
        const path = window.location.pathname.toLowerCase();
        const playerMode = path.indexOf('editor') === -1;
        const fullScreen = path.indexOf('fullscreen') !== -1;
        if (this.props.playerMode !== playerMode) {
            this.props.setPlayer(playerMode);
        }
        if (this.props.fullScreen !== fullScreen) {
            this.props.setFullScreen(fullScreen);
        }
    }
    pushHistory (push) {
        // update URI to match mode
        const idPath = this.state.projectId ? `${this.state.projectId}/` : '';
        let modePath = '';
        if (!this.props.playerMode) modePath = 'editor/';
        // fullscreen overrides editor
        if (this.props.fullScreen) modePath = 'fullscreen/';
        const newPath = `/projects/${idPath}${modePath}`;
        if (push) {
            history.pushState(
                {},
                document.title,
                newPath
            );
        } else {
            history.replaceState(
                {},
                document.title,
                newPath
            );
        }
    }
    handleToggleStudio (studio) {
        // only send add or leave request to server if we know current status
        if ((typeof studio !== 'undefined') && ('includesProject' in studio)) {
            this.props.toggleStudio(
                (studio.includesProject === false),
                studio.id,
                this.props.projectInfo.id,
                this.props.user.token
            );
        }
    }
    handleFavoriteToggle () {
        this.props.setFavedStatus(
            !this.props.faved,
            this.props.projectInfo.id,
            this.props.user.username,
            this.props.user.token
        );
        if (this.props.faved) {
            this.setState(state => ({
                favoriteCount: state.favoriteCount - 1
            }));
        } else {
            this.setState(state => ({
                favoriteCount: state.favoriteCount + 1
            }));
        }
    }
    handleLoadMore () {
        this.props.getTopLevelComments(this.state.projectId, this.props.comments.length,
            this.props.isAdmin, this.props.user && this.props.user.token);
    }
    handleLoveToggle () {
        this.props.setLovedStatus(
            !this.props.loved,
            this.props.projectInfo.id,
            this.props.user.username,
            this.props.user.token
        );
        if (this.props.loved) {
            this.setState(state => ({
                loveCount: state.loveCount - 1
            }));
        } else {
            this.setState(state => ({
                loveCount: state.loveCount + 1
            }));
        }
    }
    handleRemix () {
        this.props.remixProject();
    }
    handleSeeInside () {
        this.props.setPlayer(false);
        if (this.state.justRemixed || this.state.justShared) {
            this.setState({
                justRemixed: false,
                justShared: false
            });
        }
    }
    handleShare () {
        this.props.shareProject(
            this.props.projectInfo.id,
            this.props.user.token
        );
        this.setState({
            justRemixed: false,
            justShared: true
        });
    }
    handleUpdate (jsonData) {
        this.props.updateProject(
            this.props.projectInfo.id,
            jsonData,
            this.props.user.username,
            this.props.user.token
        );
    }
    handleUpdateProjectTitle (title) {
        this.handleUpdate({
            title: title
        });
    }
    handleSetLanguage (locale) {
        jar.set('scratchlanguage', locale);
    }
    handleUpdateProjectId (projectId, callback) {
        this.setState({projectId: projectId}, () => {
            const parts = window.location.pathname.toLowerCase()
                .split('/')
                .filter(Boolean);
            let newUrl;
            if (projectId === '0') {
                newUrl = `/${parts[0]}/editor`;
            } else {
                let modePath = '';
                if (!this.props.playerMode) modePath = '/editor';
                newUrl = `/${parts[0]}/${projectId}${modePath}`;
            }
            history.pushState(
                {projectId: projectId},
                {projectId: projectId},
                newUrl
            );
            if (callback) callback();
        });
    }
    handleSeeAllComments () {
        // Remove hash from URL
        history.pushState('', document.title, window.location.pathname + window.location.search);
        this.setState({singleCommentId: null});
        this.props.handleSeeAllComments(
            this.props.projectInfo.id,
            this.props.isAdmin,
            this.props.user.token
        );
    }
    handleCopyProjectLink () {
        // Use the pathname so we do not have to update this if path changes
        // Also do not include hash or query params
        copy(`${window.location.origin}${window.location.pathname}`);
    }
    initCounts (favorites, loves) {
        this.setState({
            favoriteCount: favorites,
            loveCount: loves
        });
    }
    renderLogin ({onClose}) {
        return (
            <ConnectedLogin
                key="login-dropdown-presentation"
                /* eslint-disable react/jsx-no-bind */
                onLogIn={(formData, callback) => {
                    this.props.handleLogIn(formData, result => {
                        if (result.success === true) {
                            onClose();
                        }
                        callback(result);
                    });
                }}
                /* eslint-ensable react/jsx-no-bind */
            />
        );
    }
    render () {
        if (this.props.projectNotAvailable || this.state.invalidProject) {
            return (
                <Page>
                    <div className="preview">
                        <NotAvailable />
                    </div>
                </Page>
            );
        }

        return (
            this.props.playerMode ?
                <Page>
                    <PreviewPresentation
                        addToStudioOpen={this.state.addToStudioOpen}
                        adminModalOpen={this.state.adminModalOpen}
                        adminPanelOpen={this.state.adminPanelOpen}
                        assetHost={this.props.assetHost}
                        backpackHost={this.props.backpackHost}
                        canAddToStudio={this.props.canAddToStudio}
                        canDeleteComments={this.props.isAdmin || this.props.userOwnsProject}
                        canRemix={this.props.canRemix}
                        canReport={this.props.canReport}
                        canRestoreComments={this.props.isAdmin}
                        canSave={this.props.canSave}
                        canShare={this.props.canShare || this.props.isAdmin}
                        canUseBackpack={this.props.canUseBackpack}
                        cloudHost={this.props.cloudHost}
                        comments={this.props.comments}
                        editable={this.props.isEditable}
                        extensions={this.state.extensions}
                        faved={this.props.faved}
                        favoriteCount={this.state.favoriteCount}
                        isFullScreen={this.state.isFullScreen}
                        isLoggedIn={this.props.isLoggedIn}
                        isNewScratcher={this.props.isNewScratcher}
                        isRemixing={this.state.isRemixing}
                        isScratcher={this.props.isScratcher}
                        isShared={this.props.isShared}
                        justRemixed={this.state.justRemixed}
                        justShared={this.state.justShared}
                        loveCount={this.state.loveCount}
                        loved={this.props.loved}
                        modInfo={this.state.modInfo}
                        moreCommentsToLoad={this.props.moreCommentsToLoad}
                        originalInfo={this.props.original}
                        parentInfo={this.props.parent}
                        projectHost={this.props.projectHost}
                        projectId={this.state.projectId}
                        projectInfo={this.props.projectInfo}
                        projectStudios={this.props.projectStudios}
                        remixes={this.props.remixes}
                        replies={this.props.replies}
                        reportOpen={this.state.reportOpen}
                        showAdminPanel={this.props.isAdmin}
                        showModInfo={this.props.isAdmin}
                        singleCommentId={this.state.singleCommentId}
                        userOwnsProject={this.props.userOwnsProject}
                        visibilityInfo={this.props.visibilityInfo}
                        onAddComment={this.handleAddComment}
                        onAddToStudioClicked={this.handleAddToStudioClick}
                        onAddToStudioClosed={this.handleAddToStudioClose}
                        onCloseAdminPanel={this.handleCloseAdminPanel}
                        onCopyProjectLink={this.handleCopyProjectLink}
                        onDeleteComment={this.handleDeleteComment}
                        onFavoriteClicked={this.handleFavoriteToggle}
                        onLoadMore={this.handleLoadMore}
                        onLoveClicked={this.handleLoveToggle}
                        onOpenAdminPanel={this.handleOpenAdminPanel}
                        onRemix={this.handleRemix}
                        onRemixing={this.handleIsRemixing}
                        onReportClicked={this.handleReportClick}
                        onReportClose={this.handleReportClose}
                        onReportComment={this.handleReportComment}
                        onReportSubmit={this.handleReportSubmit}
                        onRestoreComment={this.handleRestoreComment}
                        onSeeAllComments={this.handleSeeAllComments}
                        onSeeInside={this.handleSeeInside}
                        onShare={this.handleShare}
                        onToggleComments={this.handleToggleComments}
                        onToggleStudio={this.handleToggleStudio}
                        onUpdate={this.handleUpdate}
                        onUpdateProjectId={this.handleUpdateProjectId}
                    />
                </Page> :
                <React.Fragment>
                    <IntlGUI
                        assetHost={this.props.assetHost}
                        authorId={this.props.authorId}
                        authorThumbnailUrl={this.props.authorThumbnailUrl}
                        authorUsername={this.props.authorUsername}
                        backpackHost={this.props.backpackHost}
                        backpackVisible={this.props.canUseBackpack}
                        basePath="/"
                        canCreateCopy={this.props.canCreateCopy}
                        canCreateNew={this.props.canCreateNew}
                        canEditTitle={this.props.isEditable}
                        canRemix={this.props.canRemix}
                        canSave={this.props.canSave}
                        canShare={this.props.canShare}
                        className="gui"
                        cloudHost={this.props.cloudHost}
                        enableCommunity={this.props.enableCommunity}
                        hasCloudPermission={this.props.isScratcher}
                        isShared={this.props.isShared}
                        projectHost={this.props.projectHost}
                        projectId={this.state.projectId}
                        projectTitle={this.props.projectInfo.title}
                        renderLogin={this.renderLogin}
                        onLogOut={this.props.handleLogOut}
                        onOpenRegistration={this.props.handleOpenRegistration}
                        onRemixing={this.handleIsRemixing}
                        onSetLanguage={this.handleSetLanguage}
                        onShare={this.handleShare}
                        onToggleLoginOpen={this.props.handleToggleLoginOpen}
                        onUpdateProjectId={this.handleUpdateProjectId}
                        onUpdateProjectThumbnail={this.props.handleUpdateProjectThumbnail}
                        onUpdateProjectTitle={this.handleUpdateProjectTitle}
                    />
                    <Registration />
                    <CanceledDeletionModal />
                </React.Fragment>

        );
    }
}

Preview.propTypes = {
    assetHost: PropTypes.string.isRequired,
    // If there's no author, this will be false`
    authorId: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
    authorThumbnailUrl: PropTypes.string,
    // If there's no author, this will be false`
    authorUsername: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
    backpackHost: PropTypes.string,
    canAddToStudio: PropTypes.bool,
    canCreateCopy: PropTypes.bool,
    canCreateNew: PropTypes.bool,
    canRemix: PropTypes.bool,
    canReport: PropTypes.bool,
    canSave: PropTypes.bool,
    canShare: PropTypes.bool,
    canUseBackpack: PropTypes.bool,
    cloudHost: PropTypes.string,
    comments: PropTypes.arrayOf(PropTypes.object),
    enableCommunity: PropTypes.bool,
    faved: PropTypes.bool,
    fullScreen: PropTypes.bool,
    getCommentById: PropTypes.func.isRequired,
    getCuratedStudios: PropTypes.func.isRequired,
    getFavedStatus: PropTypes.func.isRequired,
    getLovedStatus: PropTypes.func.isRequired,
    getOriginalInfo: PropTypes.func.isRequired,
    getParentInfo: PropTypes.func.isRequired,
    getProjectInfo: PropTypes.func.isRequired,
    getProjectStudios: PropTypes.func.isRequired,
    getRemixes: PropTypes.func.isRequired,
    getTopLevelComments: PropTypes.func.isRequired,
    handleAddComment: PropTypes.func,
    handleDeleteComment: PropTypes.func,
    handleLogIn: PropTypes.func,
    handleLogOut: PropTypes.func,
    handleOpenRegistration: PropTypes.func,
    handleReportComment: PropTypes.func,
    handleRestoreComment: PropTypes.func,
    handleSeeAllComments: PropTypes.func,
    handleToggleLoginOpen: PropTypes.func,
    handleUpdateProjectThumbnail: PropTypes.func,
    isAdmin: PropTypes.bool,
    isEditable: PropTypes.bool,
    isLoggedIn: PropTypes.bool,
    isNewScratcher: PropTypes.bool,
    isScratcher: PropTypes.bool,
    isShared: PropTypes.bool,
    loved: PropTypes.bool,
    moreCommentsToLoad: PropTypes.bool,
    original: projectShape,
    parent: projectShape,
    playerMode: PropTypes.bool,
    projectHost: PropTypes.string.isRequired,
    projectInfo: projectShape,
    projectNotAvailable: PropTypes.bool,
    projectStudios: PropTypes.arrayOf(PropTypes.object),
    remixProject: PropTypes.func,
    remixes: PropTypes.arrayOf(PropTypes.object),
    replies: PropTypes.objectOf(PropTypes.array),
    reportProject: PropTypes.func,
    resetProject: PropTypes.func,
    sessionStatus: PropTypes.string,
    setFavedStatus: PropTypes.func.isRequired,
    setFullScreen: PropTypes.func.isRequired,
    setLovedStatus: PropTypes.func.isRequired,
    setPlayer: PropTypes.func.isRequired,
    shareProject: PropTypes.func.isRequired,
    toggleStudio: PropTypes.func.isRequired,
    updateProject: PropTypes.func.isRequired,
    user: PropTypes.shape({
        id: PropTypes.number,
        banned: PropTypes.bool,
        username: PropTypes.string,
        token: PropTypes.string,
        thumbnailUrl: PropTypes.string,
        dateJoined: PropTypes.string,
        email: PropTypes.string,
        classroomId: PropTypes.string
    }),
    userOwnsProject: PropTypes.bool,
    userPresent: PropTypes.bool,
    visibilityInfo: PropTypes.shape({
        censored: PropTypes.bool,
        message: PropTypes.string,
        deleted: PropTypes.bool,
        reshareable: PropTypes.bool
    })
};

Preview.defaultProps = {
    assetHost: process.env.ASSET_HOST,
    backpackHost: process.env.BACKPACK_HOST,
    canUseBackpack: false,
    cloudHost: process.env.CLOUDDATA_HOST,
    projectHost: process.env.PROJECT_HOST,
    sessionStatus: sessionActions.Status.NOT_FETCHED,
    user: {},
    userPresent: false
};

const mapStateToProps = state => {
    const projectInfoPresent = state.preview.projectInfo &&
            Object.keys(state.preview.projectInfo).length > 0 && state.preview.projectInfo.id > 0;
    const userPresent = state.session.session.user !== null &&
        typeof state.session.session.user !== 'undefined' &&
        Object.keys(state.session.session.user).length > 0;
    const isLoggedIn = state.session.status === sessionActions.Status.FETCHED &&
        userPresent;
    const isAdmin = isLoggedIn && state.session.session.permissions.admin;
    const author = projectInfoPresent && state.preview.projectInfo.author;
    const authorPresent = author && Object.keys(state.preview.projectInfo.author).length > 0;
    const authorId = authorPresent && author.id && author.id.toString();
    const authorUsername = authorPresent && author.username;
    const userOwnsProject = isLoggedIn && authorPresent &&
        state.session.session.user.id.toString() === authorId;

    return {
        authorId: authorId,
        authorThumbnailUrl: thumbnailUrl(authorId),
        authorUsername: authorUsername,
        canAddToStudio: userOwnsProject,
        canCreateCopy: userOwnsProject && projectInfoPresent,
        canCreateNew: isLoggedIn,
        canRemix: isLoggedIn && projectInfoPresent && !userOwnsProject,
        canReport: isLoggedIn && !userOwnsProject,
        canSave: isLoggedIn && userOwnsProject,
        canShare: userOwnsProject && state.permissions.social,
        canUseBackpack: isLoggedIn,
        comments: state.preview.comments,
        enableCommunity: projectInfoPresent,
        faved: state.preview.faved,
        fullScreen: state.scratchGui.mode.isFullScreen,
        // project is editable iff logged in user is the author of the project, or
        // logged in user is an admin.
        isEditable: isLoggedIn &&
            (authorUsername === state.session.session.user.username ||
            state.permissions.admin === true),
        isLoggedIn: isLoggedIn,
        isAdmin: isAdmin,
        isNewScratcher: isLoggedIn && state.permissions.new_scratcher,
        isScratcher: isLoggedIn && state.permissions.scratcher,
        // if we don't have projectInfo, assume it's shared until we know otherwise
        isShared: !projectInfoPresent || state.preview.projectInfo.is_published,
        loved: state.preview.loved,
        moreCommentsToLoad: state.preview.moreCommentsToLoad,
        original: state.preview.original,
        parent: state.preview.parent,
        playerMode: state.scratchGui.mode.isPlayerOnly,
        projectInfo: state.preview.projectInfo,
        projectNotAvailable: state.preview.projectNotAvailable,
        projectStudios: state.preview.projectStudios,
        remixes: state.preview.remixes,
        replies: state.preview.replies,
        sessionStatus: state.session.status, // check if used
        user: state.session.session.user,
        userOwnsProject: userOwnsProject,
        userPresent: userPresent,
        visibilityInfo: state.preview.visibilityInfo
    };
};

const mapDispatchToProps = dispatch => ({
    handleAddComment: (comment, topLevelCommentId) => {
        dispatch(previewActions.addNewComment(comment, topLevelCommentId));
    },
    handleDeleteComment: (projectId, commentId, topLevelCommentId, token) => {
        dispatch(previewActions.deleteComment(projectId, commentId, topLevelCommentId, token));
    },
    handleReportComment: (projectId, commentId, topLevelCommentId, token) => {
        dispatch(previewActions.reportComment(projectId, commentId, topLevelCommentId, token));
    },
    handleRestoreComment: (projectId, commentId, topLevelCommentId, token) => {
        dispatch(previewActions.restoreComment(projectId, commentId, topLevelCommentId, token));
    },
    handleOpenRegistration: event => {
        event.preventDefault();
        dispatch(navigationActions.setRegistrationOpen(true));
    },
    handleLogIn: (formData, callback) => {
        dispatch(navigationActions.handleLogIn(formData, callback));
    },
    handleLogOut: event => {
        event.preventDefault();
        dispatch(navigationActions.handleLogOut());
    },
    handleToggleLoginOpen: event => {
        event.preventDefault();
        dispatch(navigationActions.toggleLoginOpen());
    },
    handleSeeAllComments: (id, isAdmin, token) => {
        dispatch(previewActions.resetComments());
        dispatch(previewActions.getTopLevelComments(id, 0, isAdmin, token));
    },
    handleUpdateProjectThumbnail: (id, blob) => {
        dispatch(previewActions.updateProjectThumbnail(id, blob));
    },
    getOriginalInfo: id => {
        dispatch(previewActions.getOriginalInfo(id));
    },
    getParentInfo: id => {
        dispatch(previewActions.getParentInfo(id));
    },
    getProjectInfo: (id, token) => {
        dispatch(previewActions.getProjectInfo(id, token));
    },
    getRemixes: id => {
        dispatch(previewActions.getRemixes(id));
    },
    getProjectStudios: id => {
        dispatch(previewActions.getProjectStudios(id));
    },
    getCuratedStudios: (username, token) => {
        dispatch(previewActions.getCuratedStudios(username, token));
    },
    toggleStudio: (isAdd, studioId, id, token) => {
        if (isAdd === true) {
            dispatch(previewActions.addToStudio(studioId, id, token));
        } else {
            dispatch(previewActions.leaveStudio(studioId, id, token));
        }
    },
    getTopLevelComments: (id, offset, isAdmin, token) => {
        dispatch(previewActions.getTopLevelComments(id, offset, isAdmin, token));
    },
    getCommentById: (projectId, commentId, isAdmin, token) => {
        dispatch(previewActions.getCommentById(projectId, commentId, isAdmin, token));
    },
    getFavedStatus: (id, username, token) => {
        dispatch(previewActions.getFavedStatus(id, username, token));
    },
    setFavedStatus: (faved, id, username, token) => {
        dispatch(previewActions.setFavedStatus(faved, id, username, token));
    },
    getLovedStatus: (id, username, token) => {
        dispatch(previewActions.getLovedStatus(id, username, token));
    },
    setLovedStatus: (loved, id, username, token) => {
        dispatch(previewActions.setLovedStatus(loved, id, username, token));
    },
    shareProject: (id, token) => {
        dispatch(previewActions.shareProject(id, token));
    },
    reportProject: (id, formData, token) => {
        dispatch(previewActions.reportProject(id, formData, token));
    },
    resetProject: () => {
        dispatch(previewActions.resetProject());
    },
    setOriginalInfo: info => {
        dispatch(previewActions.setOriginalInfo(info));
    },
    setParentInfo: info => {
        dispatch(previewActions.setParentInfo(info));
    },
    updateProject: (id, formData, username, token) => {
        dispatch(previewActions.updateProject(id, formData, username, token));
    },
    remixProject: () => {
        dispatch(GUI.remixProject());
        dispatch(previewActions.resetComments());
    },
    setPlayer: player => {
        dispatch(GUI.setPlayer(player));
    },
    setFullScreen: fullscreen => {
        dispatch(GUI.setFullScreen(fullscreen));
    }
});

module.exports.View = connect(
    mapStateToProps,
    mapDispatchToProps
)(Preview);

// replace old Scratch 2.0-style hashtag URLs with updated format
if (window.location.hash) {
    let pathname = window.location.pathname;
    if (pathname.substr(-1) !== '/') {
        pathname = `${pathname}/`;
    }
    if (window.location.hash === '#editor') {
        history.replaceState({}, document.title,
            `${pathname}editor${window.location.search}`);
    }
    if (window.location.hash === '#fullscreen') {
        history.replaceState({}, document.title,
            `${pathname}fullscreen${window.location.search}`);
    }
}

// initialize GUI by calling its reducer functions depending on URL
GUI.setAppElement(document.getElementById('app'));
module.exports.initGuiState = guiInitialState => {
    const pathname = window.location.pathname.toLowerCase();
    const parts = pathname.split('/').filter(Boolean);
    // parts[0]: 'projects'
    // parts[1]: either :id or 'editor'
    // parts[2]: undefined if no :id, otherwise either 'editor', 'fullscreen' or 'embed'
    if (parts.indexOf('editor') === -1) {
        guiInitialState = GUI.initPlayer(guiInitialState);
    }
    if (parts.indexOf('fullscreen') !== -1) {
        guiInitialState = GUI.initFullScreen(guiInitialState);
    }
    if (parts.indexOf('embed') !== -1) {
        guiInitialState = GUI.initEmbedded(guiInitialState);
    }
    return guiInitialState;
};

module.exports.guiReducers = GUI.guiReducers;
module.exports.guiInitialState = GUI.guiInitialState;
module.exports.guiMiddleware = GUI.guiMiddleware;
module.exports.initLocale = GUI.initLocale;
module.exports.localesInitialState = GUI.localesInitialState;
