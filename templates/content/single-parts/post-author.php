<?php
/**
 * Single post author block: avatar, name, job, "All Posts", optional bio.
 * Args via get_query_var( 'codeweber_single_author_args', [] ):
 * - show_bio (bool) — показывать описание автора. По умолчанию true.
 */
if (!defined('ABSPATH')) {
	return;
}
$args = get_query_var('codeweber_single_author_args', []);
$show_bio = isset($args['show_bio']) ? $args['show_bio'] : true;
$user_id = get_the_author_meta('ID');

$avatar_id = get_user_meta($user_id, 'avatar_id', true);
if (empty($avatar_id)) {
	$avatar_id = get_user_meta($user_id, 'custom_avatar_id', true);
}
?>
<div class="author-info d-md-flex align-items-center mb-3">
	<div class="d-flex align-items-center">
		<?php if (!empty($avatar_id)) :
			$avatar_src = wp_get_attachment_image_src($avatar_id, 'thumbnail');
		?>
			<figure class="user-avatar shadow me-3">
				<img class="rounded-circle" alt="<?php the_author_meta('display_name'); ?>" src="<?php echo esc_url($avatar_src[0]); ?>">
			</figure>
		<?php else : ?>
			<figure class="user-avatar shadow me-3">
				<?php echo get_avatar(get_the_author_meta('user_email'), 96, '', '', ['class' => 'rounded-circle']); ?>
			</figure>
		<?php endif; ?>

		<div>
			<h6>
				<a href="<?php echo esc_url(get_author_posts_url($user_id)); ?>" class="link-dark text-reset">
					<?php the_author_meta('first_name'); ?> <?php the_author_meta('last_name'); ?>
				</a>
			</h6>
			<?php
			$job_title = get_user_meta($user_id, 'user_position', true);
			if (empty($job_title)) {
				$job_title = __('Writer', 'codeweber');
			}
			?>
			<span class="post-meta fs-15"><?php echo esc_html__('Author', 'hoger') . ': ' . esc_html($job_title); ?></span>
		</div>
	</div>

	<div class="mt-3 mt-md-0 ms-auto">
		<a href="<?php echo esc_url(get_author_posts_url($user_id)); ?>" class="btn btn-sm btn-soft-ash <?php echo esc_attr(class_exists('Codeweber_Options') ? Codeweber_Options::style('button', ' rounded mt-2') : ' rounded mt-2'); ?> btn-icon btn-icon-start mb-0 has-ripple">
			<i class="uil uil-file-alt"></i> <?php esc_html_e('All Posts', 'codeweber'); ?>
		</a>
	</div>
</div>

<?php if ($show_bio) :
	$bio = get_user_meta($user_id, 'description', true);
	if (!empty($bio)) :
?>
	<p><?php echo esc_html($bio); ?></p>
	<!-- /.author-bio -->
<?php
	endif;
endif;
?>
