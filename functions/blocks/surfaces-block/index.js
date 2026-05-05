(function () {
	var el               = wp.element.createElement;
	var __               = wp.i18n.__;
	var useState         = wp.element.useState;
	var useEffect        = wp.element.useEffect;
	var registerBlockType = wp.blocks.registerBlockType;
	var InspectorControls = wp.blockEditor.InspectorControls;
	var useBlockProps    = wp.blockEditor.useBlockProps;
	var PanelBody        = wp.components.PanelBody;
	var SelectControl    = wp.components.SelectControl;
	var RadioControl     = wp.components.RadioControl;
	var ServerSideRender = wp.serverSideRender;

	registerBlockType( 'hoger/surfaces', {
		title:    __( 'Surfaces', 'hoger' ),
		icon:     'art',
		category: 'widgets',
		attributes: {
			postId: { type: 'number', default: 0 },
			shape:  { type: 'string', default: 'circle' },
		},

		edit: function ( props ) {
			var attributes    = props.attributes;
			var setAttributes = props.setAttributes;
			var blockProps    = useBlockProps();

			var postsState = useState( [] );
			var posts      = postsState[0];
			var setPosts   = postsState[1];

			useEffect( function () {
				wp.apiFetch( { path: '/wp/v2/surfaces?per_page=100&_fields=id,title' } )
					.then( function ( data ) {
						setPosts(
							data.map( function ( p ) {
								return { label: p.title.rendered, value: p.id };
							} )
						);
					} );
			}, [] );

			var options = [ { label: __( '— Select surface —', 'hoger' ), value: 0 } ].concat( posts );

			return el(
				'div', blockProps,
				el( InspectorControls, null,
					el( PanelBody, { title: __( 'Surface Settings', 'hoger' ), initialOpen: true },
						el( SelectControl, {
							label:    __( 'Surface', 'hoger' ),
							value:    attributes.postId,
							options:  options,
							onChange: function ( val ) {
								setAttributes( { postId: parseInt( val, 10 ) } );
							},
						} ),
						el( RadioControl, {
							label:    __( 'Swatch shape', 'hoger' ),
							selected: attributes.shape,
							options: [
								{ label: __( 'Circle', 'hoger' ), value: 'circle' },
								{ label: __( 'Square', 'hoger' ), value: 'square' },
							],
							onChange: function ( val ) {
								setAttributes( { shape: val } );
							},
						} )
					)
				),
				attributes.postId
					? el( ServerSideRender, { block: 'hoger/surfaces', attributes: attributes } )
					: el( 'p', { style: { padding: '1rem', color: '#999' } },
						__( 'Select a surface in the sidebar.', 'hoger' ) )
			);
		},

		save: function () { return null; },
	} );
}() );
