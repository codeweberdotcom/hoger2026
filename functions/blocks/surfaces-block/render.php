<?php

function hoger_render_surfaces_block( $attributes ) {
	$post_id = isset( $attributes['postId'] ) ? (int) $attributes['postId'] : 0;
	$shape   = isset( $attributes['shape'] ) ? $attributes['shape'] : 'square';
	$rounded = ( $shape === 'circle' ) ? 'rounded-circle' : 'rounded';

	if ( ! $post_id ) {
		return '<p class="text-muted p-3">' . esc_html__( 'Select a surface in the block settings.', 'hoger' ) . '</p>';
	}

	$post = get_post( $post_id );
	if ( ! $post || $post->post_type !== 'surfaces' ) {
		return '';
	}

	$title        = get_the_title( $post_id );
	$colors_count = (int) get_post_meta( $post_id, 'czveta', true );

	ob_start();
	?>
	<div class="row gx-4 gy-4">
		<?php for ( $i = 0; $i < $colors_count; $i++ ) :
			$color_name = get_post_meta( $post_id, "czveta_{$i}_nazvanie_czveta", true );
			$photo_id   = get_post_meta( $post_id, "czveta_{$i}_foto_czveta", true );
			if ( ! $photo_id ) continue;
			$img_url  = wp_get_attachment_image_url( $photo_id, 'medium' );
			$full_url = wp_get_attachment_image_url( $photo_id, 'full' );
			if ( ! $img_url ) continue;
			?>
			<div class="col-6 col-md-4 col-xl-2">
				<figure class="overlay overlay-5 hover-scale hover-plus bottom-overlay <?php echo esc_attr( $rounded ); ?> overflow-hidden position-relative mb-0"
				        style="aspect-ratio:1/1">
					<a href="<?php echo esc_url( $full_url ); ?>"
					   data-glightbox="title: <?php echo esc_attr( $title . ' — ' . $color_name ); ?>;"
					   data-gallery="surface-<?php echo esc_attr( (string) $post_id ); ?>">
						<img src="<?php echo esc_url( $img_url ); ?>"
						     alt="<?php echo esc_attr( $color_name ); ?>"
						     decoding="async"
						     style="width:100%;height:100%;object-fit:cover">
						<span class="hover-icon text-white">
							<svg fill="currentColor" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
								<path d="M220,128a4.0002,4.0002,0,0,1-4,4H132v84a4,4,0,0,1-8,0V132H40a4,4,0,0,1,0-8h84V40a4,4,0,0,1,8,0v84h84A4.0002,4.0002,0,0,1,220,128Z"></path>
							</svg>
						</span>
					</a>
					<figcaption class="position-absolute bottom-0 start-0 end-0 p-2 text-white text-center">
						<p class="mb-0 fs-13"><?php echo esc_html( $color_name ); ?></p>
					</figcaption>
				</figure>
			</div>
		<?php endfor; ?>
	</div>
	<?php
	return ob_get_clean();
}
