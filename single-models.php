<?php
/**
 * Single template: 3D Models CPT
 *
 * @package hoger
 */

get_header();

while ( have_posts() ) :
	the_post();

	$post_id = get_the_ID();

	// Meta fields
	$fbx_id     = (int) get_post_meta( $post_id, 'model_fbx', true );
	$fbx_url    = $fbx_id ? wp_get_attachment_url( $fbx_id ) : '';
	$subtitle   = get_post_meta( $post_id, 'podzagolovok_straniczy', true );

	// Viewer settings
	$bg_color        = get_post_meta( $post_id, 'mn_bg_color', true ) ?: '#f2f2fb';
	$edge_color      = get_post_meta( $post_id, 'mn_edge_color', true ) ?: '#0057b8';
	$bg_soft         = get_post_meta( $post_id, 'mn_bg_soft', true ) === '1' ? '1' : '0';
	$edge_soft       = get_post_meta( $post_id, 'mn_edge_soft', true ) === '1' ? '1' : '0';
	$use_fbx_colors  = get_post_meta( $post_id, 'mn_use_fbx_colors', true ) === '1' ? '1' : '0';
	$auto_rotate     = get_post_meta( $post_id, 'mn_auto_rotate', true );
	$auto_rotate     = $auto_rotate === '0' ? '0' : '1';
	$mesh_colors_raw = get_post_meta( $post_id, 'mn_mesh_colors', true ) ?: '{}';
	if ( json_decode( $mesh_colors_raw ) === null ) {
		$mesh_colors_raw = '{}';
	}

	// Global viewer settings
	$show_play_btn      = hoger_mn_get( 'show_play_btn' );
	$show_edges_btn     = hoger_mn_get( 'show_edges_btn' );
	$enable_zoom        = hoger_mn_get( 'enable_zoom' );
	$enable_orbit       = hoger_mn_get( 'enable_orbit' );
	$global_auto_rotate = hoger_mn_get( 'enable_auto_rotate' );
	$auto_rotate_speed  = hoger_mn_get( 'auto_rotate_speed' ) ?: '0.5';
	if ( $auto_rotate === '0' ) {
		$global_auto_rotate = '0';
	}

	// Supports both native array format and ACF repeater format
	$params_raw = get_post_meta( $post_id, 'perechen_parametrov_pod_zagolovokom', true );
	if ( is_array( $params_raw ) && ! empty( $params_raw ) ) {
		$params = $params_raw;
	} else {
		// ACF repeater stores items as individual meta keys; main key may be empty or integer count
		$params = [];
		$i      = 0;
		while ( true ) {
			$item = get_post_meta( $post_id, 'perechen_parametrov_pod_zagolovokom_' . $i . '_element_spiska', true );
			if ( $item === '' || $item === false ) {
				break;
			}
			$params[] = [ 'element_spiska' => $item ];
			$i++;
		}
	}

	$description = get_post_meta( $post_id, 'opisanie_modeli', true );
	$katalog_id  = (int) get_post_meta( $post_id, 'tehnicheskij_katalog', true );
	$katalog_url = $katalog_id ? wp_get_attachment_url( $katalog_id ) : '';

	// ACF relationship field stores as serialized array of IDs
	$product_raw = get_post_meta( $post_id, 'tovar_s_konfiguratorom', true );
	$product_id  = is_array( $product_raw ) ? (int) reset( $product_raw ) : (int) $product_raw;

	$vid_id         = (int) get_post_meta( $post_id, 'obshhij_vid', true );
	$vid_title      = get_post_meta( $post_id, 'zagolovok_obshhego_vida', true );
	$razrez1_id     = (int) get_post_meta( $post_id, 'razrez_1', true );
	$razrez1_title  = get_post_meta( $post_id, 'zagolovokrazreza1', true );
	$razrez2_id     = (int) get_post_meta( $post_id, 'razrez_2', true );
	$razrez2_title  = get_post_meta( $post_id, 'zagolovok_razreza_2', true );
	$drawing_desc   = get_post_meta( $post_id, 'opisanie_chertezha', true );

	?>

	<!-- Section 1: 3D Model + Product Details -->
	<section class="wrapper bg-light">
		<div class="container">
			<div class="row gx-lg-8 gx-xl-12 gy-10 align-items-center">

				<?php if ( $fbx_url ) : ?>
				<div class="col-md-6 col-lg-6 position-relative">
					<div class="mn-canvas-wrap" style="position:relative;width:100%;aspect-ratio:1/1;">
						<canvas
							data-three-fry
							data-three="<?php echo esc_url( $fbx_url ); ?>"
							data-bg-color="<?php echo esc_attr( $bg_color ); ?>"
							data-bg-soft="<?php echo esc_attr( $bg_soft ); ?>"
							data-edge-color="<?php echo esc_attr( $edge_color ); ?>"
							data-edge-soft="<?php echo esc_attr( $edge_soft ); ?>"
							data-auto-rotate="<?php echo esc_attr( $global_auto_rotate ); ?>"
							data-rotate-speed="<?php echo esc_attr( $auto_rotate_speed ); ?>"
							data-show-play="<?php echo esc_attr( $show_play_btn ); ?>"
							data-show-edges="<?php echo esc_attr( $show_edges_btn ); ?>"
							data-enable-zoom="<?php echo esc_attr( $enable_zoom ); ?>"
							data-enable-orbit="<?php echo esc_attr( $enable_orbit ); ?>"
							data-use-fbx-colors="<?php echo esc_attr( $use_fbx_colors ); ?>"
							data-mesh-colors="<?php echo esc_attr( $mesh_colors_raw ); ?>"
							style="display:block;width:100%;height:100%;">
						</canvas>
					</div>
				</div>
				<?php endif; ?>

				<div class="col-lg-6 pb-10 py-md-14">
					<h1 class="display-1 ls-xs fs-35 mb-4 text-dark"><?php the_title(); ?></h1>

					<?php if ( $subtitle ) : ?>
						<p class="lead fs-25 lh-sm mb-3"><?php echo esc_html( $subtitle ); ?></p>
					<?php endif; ?>

					<?php if ( ! empty( $params ) ) : ?>
						<ul class="icon-list bullet-bg bullet-soft-dark mb-5">
							<?php foreach ( $params as $item ) : ?>
								<li>
									<i class="uil uil-check"></i><?php echo esc_html( $item['element_spiska'] ?? '' ); ?>
								</li>
							<?php endforeach; ?>
						</ul>
					<?php endif; ?>

					<?php if ( $description ) : ?>
						<p><?php echo wp_kses_post( $description ); ?></p>
					<?php endif; ?>

					<?php if ( $katalog_url ) : ?>
						<a class="btn btn-dark rounded-pill mb-1 btn-icon btn-icon-start"
							target="_blank"
							href="<?php echo esc_url( $katalog_url ); ?>">
							<i class="uil uil-ruler"></i><?php esc_html_e( 'Download Catalog', 'hoger' ); ?>
						</a>
					<?php endif; ?>

					<?php if ( $product_id ) : ?>
						<?php
						// Requires MKL Product Configurator plugin
						echo do_shortcode( '[mkl_pc id="' . (int) $product_id . '"]' );
						?>
					<?php endif; ?>
				</div>
				<!--/column -->

			</div>
			<!--/.row -->
		</div>
		<!-- /.container -->
	</section>
	<!-- /section -->

	<?php if ( $vid_id || $razrez1_id || $razrez2_id || $drawing_desc ) : ?>
	<section class="wrapper">
		<div class="container py-14">
			<style>
				.models-grid {
					display: grid;
					grid-template-columns: repeat(4, 1fr);
					grid-template-rows: repeat(2, auto);
					grid-column-gap: 0;
					grid-row-gap: 0;
				}
				@media (min-width: 992px) {
					.models-grid .div1 { grid-area: 1 / 1 / 3 / 3; }
					.models-grid .div2 { grid-area: 1 / 3 / 2 / 4; }
					.models-grid .div3 { grid-area: 1 / 4 / 2 / 5; }
					.models-grid .div4 { grid-area: 2 / 3 / 3 / 5; }
				}
				@media (max-width: 991px) {
					.models-grid {
						grid-template-columns: repeat(2, 1fr);
					}
					.models-grid .div1 { grid-area: 1 / 1 / 2 / 3; }
					.models-grid .div2 { grid-area: 2 / 1 / 3 / 2; }
					.models-grid .div3 { grid-area: 2 / 2 / 3 / 3; }
					.models-grid .div4 { grid-area: 3 / 1 / 4 / 3; }
				}
				@media (max-width: 767px) {
					.models-grid {
						grid-template-columns: 1fr;
					}
					.models-grid .div1,
					.models-grid .div2,
					.models-grid .div3,
					.models-grid .div4 {
						grid-area: unset;
					}
				}
				.models-grid figure img {
					width: 100%;
					height: 100%;
					object-fit: cover;
					display: block;
				}
				.models-grid figure {
					position: relative;
					height: 100%;
					margin: 0;
				}
			</style>

			<div class="models-grid bg-white rounded">

				<?php if ( $vid_id ) :
					$vid_src  = wp_get_attachment_image_url( $vid_id, 'large' );
					$vid_full = wp_get_attachment_url( $vid_id );
					$vid_alt  = get_post_meta( $vid_id, '_wp_attachment_image_alt', true );
				?>
				<div class="item div1">
					<div class="card card-body h-100">
						<figure class="d-flex align-items-center">
							<a href="<?php echo esc_url( $vid_full ); ?>"
								data-glightbox
								data-gallery="gallery-image">
								<img src="<?php echo esc_url( $vid_src ); ?>"
									alt="<?php echo esc_attr( $vid_alt ); ?>" />
							</a>
							<?php if ( $vid_title ) : ?>
								<div class="position-absolute bottom-0 start-0">
									<span class="display-6 fs-18 p-3 text-primary"><?php echo esc_html( $vid_title ); ?></span>
								</div>
							<?php endif; ?>
						</figure>
					</div>
				</div>
				<?php endif; ?>

				<?php if ( $razrez1_id ) :
					$r1_src  = wp_get_attachment_image_url( $razrez1_id, 'large' );
					$r1_full = wp_get_attachment_url( $razrez1_id );
					$r1_alt  = get_post_meta( $razrez1_id, '_wp_attachment_image_alt', true );
				?>
				<div class="item div2">
					<div class="card card-body h-100">
						<figure class="d-flex align-items-center flex-grow-1">
							<a href="<?php echo esc_url( $r1_full ); ?>"
								data-glightbox
								data-gallery="gallery-image">
								<img src="<?php echo esc_url( $r1_src ); ?>"
									alt="<?php echo esc_attr( $r1_alt ); ?>" />
							</a>
							<?php if ( $razrez1_title ) : ?>
								<div class="position-absolute bottom-0 start-0">
									<span class="display-6 fs-18 p-3 text-primary"><?php echo esc_html( $razrez1_title ); ?></span>
								</div>
							<?php endif; ?>
						</figure>
					</div>
				</div>
				<?php endif; ?>

				<?php if ( $razrez2_id ) :
					$r2_src  = wp_get_attachment_image_url( $razrez2_id, 'large' );
					$r2_full = wp_get_attachment_url( $razrez2_id );
					$r2_alt  = get_post_meta( $razrez2_id, '_wp_attachment_image_alt', true );
				?>
				<div class="item div3">
					<div class="card card-body h-100">
						<figure class="d-flex align-items-center flex-grow-1">
							<a href="<?php echo esc_url( $r2_full ); ?>"
								data-glightbox
								data-gallery="gallery-image">
								<img src="<?php echo esc_url( $r2_src ); ?>"
									alt="<?php echo esc_attr( $r2_alt ); ?>" />
							</a>
							<?php if ( $razrez2_title ) : ?>
								<div class="position-absolute bottom-0 start-0">
									<span class="display-6 fs-18 p-3 text-primary"><?php echo esc_html( $razrez2_title ); ?></span>
								</div>
							<?php endif; ?>
						</figure>
					</div>
				</div>
				<?php endif; ?>

				<?php if ( $drawing_desc || $product_id ) : ?>
				<div class="item div4 card card-body d-block">
					<?php if ( $drawing_desc ) : ?>
						<div class="fw-normal text-primary display-6 fs-18 mb-3">
							<?php esc_html_e( 'Drawing Notes:', 'hoger' ); ?>
						</div>
						<p><?php echo wp_kses_post( $drawing_desc ); ?></p>
					<?php endif; ?>
					<?php if ( $product_id ) : ?>
						<?php echo do_shortcode( '[mkl_pc id="' . (int) $product_id . '"]' ); ?>
					<?php endif; ?>
				</div>
				<?php endif; ?>

			</div>
		</div>
	</section>
	<?php endif; ?>

<?php endwhile; ?>

<?php
$surfaces_json = hoger_get_surfaces_json();
if ( $surfaces_json && $surfaces_json !== '[]' ) :
	$file_id  = (int) get_post_meta( get_the_ID(), 'model_fbx', true );
	$file_url = $file_id ? wp_get_attachment_url( $file_id ) : '';
	if ( $file_url ) :
		$conf_meshes_raw = get_post_meta( get_the_ID(), 'mn_conf_meshes', true ) ?: '[]';
		if ( json_decode( $conf_meshes_raw ) === null ) {
			$conf_meshes_raw = '[]';
		}

		// Camera: per-model override, fallback to global
		$conf_post_id = get_the_ID();
		$cam_x        = get_post_meta( $conf_post_id, 'mn_cam_x', true )        ?: hoger_mn_get( 'conf_cam_x' );
		$cam_y        = get_post_meta( $conf_post_id, 'mn_cam_y', true )        ?: hoger_mn_get( 'conf_cam_y' );
		$cam_z        = get_post_meta( $conf_post_id, 'mn_cam_z', true )        ?: hoger_mn_get( 'conf_cam_z' );
		$cam_target_x = get_post_meta( $conf_post_id, 'mn_cam_target_x', true ) ?: hoger_mn_get( 'conf_cam_target_x' );
		$cam_target_y = get_post_meta( $conf_post_id, 'mn_cam_target_y', true ) ?: hoger_mn_get( 'conf_cam_target_y' );
		$cam_target_z = get_post_meta( $conf_post_id, 'mn_cam_target_z', true ) ?: hoger_mn_get( 'conf_cam_target_z' );
		$cam_debug    = get_post_meta( $conf_post_id, 'mn_cam_debug', true ) === '1' ? '1' : hoger_mn_get( 'conf_cam_debug' );
?>
<section class="wrapper bg-light" id="hoger-configurator-section">
	<div class="container">
		<div class="row gx-lg-8 gx-xl-12 gy-10 align-items-center" id="hoger-configurator">

			<div class="col-md-6 col-lg-6">
				<div class="mn-canvas-wrap" style="position:relative;width:100%;aspect-ratio:1/1;">
					<canvas data-configurator
						data-three="<?php echo esc_url( $file_url ); ?>"
						data-exposure="<?php echo esc_attr( hoger_mn_get( 'conf_exposure' ) ); ?>"
						data-saturation="<?php echo esc_attr( hoger_mn_get( 'conf_saturation' ) ); ?>"
						data-env-intensity="<?php echo esc_attr( hoger_mn_get( 'conf_env_intensity' ) ); ?>"
						data-env-hdr="<?php echo esc_attr( hoger_mn_get( 'conf_env_hdr' ) ); ?>"
						data-env-jpg="<?php echo esc_attr( hoger_mn_get( 'conf_env_jpg' ) ); ?>"
						data-env-rotate="<?php echo esc_attr( hoger_mn_get( 'conf_env_rotate' ) ); ?>"
						data-env-rotate-speed="<?php echo esc_attr( hoger_mn_get( 'conf_env_rotate_speed' ) ); ?>"
						data-cam-x="<?php echo esc_attr( $cam_x ); ?>"
						data-cam-y="<?php echo esc_attr( $cam_y ); ?>"
						data-cam-z="<?php echo esc_attr( $cam_z ); ?>"
						data-cam-target-x="<?php echo esc_attr( $cam_target_x ); ?>"
						data-cam-target-y="<?php echo esc_attr( $cam_target_y ); ?>"
						data-cam-target-z="<?php echo esc_attr( $cam_target_z ); ?>"
						data-cam-debug="<?php echo esc_attr( $cam_debug ); ?>"
						data-conf-meshes="<?php echo esc_attr( $conf_meshes_raw ); ?>"
						data-default-surface="<?php echo esc_attr( get_post_meta( get_the_ID(), 'mn_default_surface_idx', true ) ); ?>"
						data-default-color="<?php echo esc_attr( get_post_meta( get_the_ID(), 'mn_default_color_idx', true ) ); ?>"
						data-cube-url="<?php echo esc_attr( hoger_mn_get( 'conf_cube_url' ) ); ?>"
						data-sphere-url="<?php echo esc_attr( hoger_mn_get( 'conf_sphere_url' ) ); ?>"
						style="display:block;width:100%;height:100%;"></canvas>
				<?php
				$cube_url   = hoger_mn_get( 'conf_cube_url' );
				$sphere_url = hoger_mn_get( 'conf_sphere_url' );
				if ( $cube_url || $sphere_url ) :
				?>
				<div class="mn-shape-switcher" style="position:absolute;bottom:12px;right:12px;z-index:50;display:flex;gap:6px;">
					<button class="mn-shape-btn mn-shape-btn--active" data-shape="model" title="<?php esc_attr_e( 'Original model', 'hoger' ); ?>" style="width:36px;height:36px;border-radius:6px;border:2px solid #9c886f;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
					</button>
					<?php if ( $cube_url ) : ?>
					<button class="mn-shape-btn" data-shape="cube" data-url="<?php echo esc_attr( $cube_url ); ?>" title="<?php esc_attr_e( 'Cube', 'hoger' ); ?>" style="width:36px;height:36px;border-radius:6px;border:2px solid transparent;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>
					</button>
					<?php endif; ?>
					<?php if ( $sphere_url ) : ?>
					<button class="mn-shape-btn" data-shape="sphere" data-url="<?php echo esc_attr( $sphere_url ); ?>" title="<?php esc_attr_e( 'Sphere', 'hoger' ); ?>" style="width:36px;height:36px;border-radius:6px;border:2px solid transparent;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 3a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><line x1="3" y1="12" x2="21" y2="12"/></svg>
					</button>
					<?php endif; ?>
				</div>
				<?php endif; ?>
				</div>
			</div>

			<div class="col-lg-6 pb-10 py-md-14 hoger-surface-picker">
				<h2 class="display-4 mb-6"><?php esc_html_e( 'Configure Surface', 'hoger' ); ?></h2>
				<p class="fw-bold mb-3"><?php esc_html_e( 'Surface type:', 'hoger' ); ?></p>
				<div class="hoger-surface-types d-flex flex-wrap gap-2 mb-5"></div>
				<p class="fw-bold mb-3"><?php esc_html_e( 'Color:', 'hoger' ); ?></p>
				<div class="hoger-surface-colors d-flex flex-wrap gap-2"></div>
			</div>

		</div>
	</div>
</section>
<script>window.hogerSurfaces = <?php echo $surfaces_json; // phpcs:ignore WordPress.Security.EscapeOutput ?>;</script>
<?php endif; endif; ?>

<?php get_footer(); ?>
