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
	var TextControl      = wp.components.TextControl;
	var ButtonGroup      = wp.components.ButtonGroup;
	var Button           = wp.components.Button;
	var ServerSideRender = wp.serverSideRender;

	// Breakpoint row for grid controls
	function BreakpointRow( props ) {
		var label = props.label;
		var value = props.value;
		var onChange = props.onChange;
		return el(
			'div',
			{ style: { display: 'flex', alignItems: 'center', marginBottom: '6px', gap: '8px' } },
			el( 'span', { style: { width: '36px', fontSize: '11px', color: '#666', flexShrink: 0 } }, label ),
			el( TextControl, {
				value: value,
				onChange: onChange,
				type: 'number',
				min: 1,
				max: 12,
				__nextHasNoMarginBottom: true,
				style: { width: '60px' },
			} )
		);
	}

	registerBlockType( 'hoger/surfaces', {
		title:    __( 'Surfaces', 'hoger' ),
		icon:     'art',
		category: 'widgets',
		attributes: {
			postId:      { type: 'number', default: 0 },
			shape:       { type: 'string', default: 'square' },
			gridType:    { type: 'string', default: 'columns-grid' },
			gutterX:     { type: 'string', default: '4' },
			gutterY:     { type: 'string', default: '4' },
			// Columns grid (row-cols-*)
			rowColsXs:   { type: 'string', default: '2' },
			rowColsSm:   { type: 'string', default: '' },
			rowColsMd:   { type: 'string', default: '3' },
			rowColsLg:   { type: 'string', default: '' },
			rowColsXl:   { type: 'string', default: '6' },
			rowColsXxl:  { type: 'string', default: '' },
			// Classic grid (col-* per item)
			colXs:       { type: 'string', default: '6' },
			colSm:       { type: 'string', default: '' },
			colMd:       { type: 'string', default: '4' },
			colLg:       { type: 'string', default: '' },
			colXl:       { type: 'string', default: '2' },
			colXxl:      { type: 'string', default: '' },
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

			var isColumnsGrid = attributes.gridType === 'columns-grid';

			return el(
				'div', blockProps,
				el( InspectorControls, null,

					// Surface & shape
					el( PanelBody, { title: __( 'Surface', 'hoger' ), initialOpen: true },
						el( SelectControl, {
							label:    __( 'Surface', 'hoger' ),
							value:    attributes.postId,
							options:  options,
							onChange: function ( val ) { setAttributes( { postId: parseInt( val, 10 ) } ); },
						} ),
						el( RadioControl, {
							label:    __( 'Swatch shape', 'hoger' ),
							selected: attributes.shape,
							options: [
								{ label: __( 'Square', 'hoger' ), value: 'square' },
								{ label: __( 'Circle', 'hoger' ), value: 'circle' },
							],
							onChange: function ( val ) { setAttributes( { shape: val } ); },
						} )
					),

					// Grid type
					el( PanelBody, { title: __( 'Grid', 'hoger' ), initialOpen: true },
						el( 'div', { style: { marginBottom: '12px' } },
							el( 'div', { className: 'component-sidebar-title', style: { marginBottom: '6px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#1e1e1e' } },
								__( 'Grid type', 'hoger' )
							),
							el( ButtonGroup, null,
								el( Button,
									{
										isPrimary:  ! isColumnsGrid,
										isSecondary: isColumnsGrid,
										onClick: function () { setAttributes( { gridType: 'classic' } ); },
									},
									__( 'Classic', 'hoger' )
								),
								el( Button,
									{
										isPrimary:  isColumnsGrid,
										isSecondary: ! isColumnsGrid,
										onClick: function () { setAttributes( { gridType: 'columns-grid' } ); },
									},
									__( 'Columns', 'hoger' )
								)
							)
						),

						// Columns grid breakpoints (row-cols-*)
						isColumnsGrid && el( 'div', { style: { marginBottom: '12px' } },
							el( 'div', { style: { fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#1e1e1e', marginBottom: '6px' } },
								__( 'Columns per row', 'hoger' )
							),
							el( BreakpointRow, { label: 'XS',  value: attributes.rowColsXs,  onChange: function(v){ setAttributes({rowColsXs:v}); } } ),
							el( BreakpointRow, { label: 'SM',  value: attributes.rowColsSm,  onChange: function(v){ setAttributes({rowColsSm:v}); } } ),
							el( BreakpointRow, { label: 'MD',  value: attributes.rowColsMd,  onChange: function(v){ setAttributes({rowColsMd:v}); } } ),
							el( BreakpointRow, { label: 'LG',  value: attributes.rowColsLg,  onChange: function(v){ setAttributes({rowColsLg:v}); } } ),
							el( BreakpointRow, { label: 'XL',  value: attributes.rowColsXl,  onChange: function(v){ setAttributes({rowColsXl:v}); } } ),
							el( BreakpointRow, { label: 'XXL', value: attributes.rowColsXxl, onChange: function(v){ setAttributes({rowColsXxl:v}); } } )
						),

						// Classic grid breakpoints (col-* per item)
						! isColumnsGrid && el( 'div', { style: { marginBottom: '12px' } },
							el( 'div', { style: { fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#1e1e1e', marginBottom: '6px' } },
								__( 'Column width', 'hoger' )
							),
							el( BreakpointRow, { label: 'XS',  value: attributes.colXs,  onChange: function(v){ setAttributes({colXs:v}); } } ),
							el( BreakpointRow, { label: 'SM',  value: attributes.colSm,  onChange: function(v){ setAttributes({colSm:v}); } } ),
							el( BreakpointRow, { label: 'MD',  value: attributes.colMd,  onChange: function(v){ setAttributes({colMd:v}); } } ),
							el( BreakpointRow, { label: 'LG',  value: attributes.colLg,  onChange: function(v){ setAttributes({colLg:v}); } } ),
							el( BreakpointRow, { label: 'XL',  value: attributes.colXl,  onChange: function(v){ setAttributes({colXl:v}); } } ),
							el( BreakpointRow, { label: 'XXL', value: attributes.colXxl, onChange: function(v){ setAttributes({colXxl:v}); } } )
						),

						// Gutters
						el( 'div', { style: { marginTop: '8px' } },
							el( 'div', { style: { fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#1e1e1e', marginBottom: '6px' } },
								__( 'Gutters', 'hoger' )
							),
							el( BreakpointRow, { label: 'gx',  value: attributes.gutterX, onChange: function(v){ setAttributes({gutterX:v}); } } ),
							el( BreakpointRow, { label: 'gy',  value: attributes.gutterY, onChange: function(v){ setAttributes({gutterY:v}); } } )
						)
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
