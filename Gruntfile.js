/* jshint node:true */
module.exports = function( grunt ) {
	'use strict';

	grunt.initConfig({

		// Load package data
		pkg: grunt.file.readJSON('package.json'),

		// Watch changes for assets
		watch: {
			readme: {
				files: ['readme.txt'],
				tasks: ['wp_readme_to_markdown'],
				options: {
					spawn: false
				}
			}
		},

		// Clean build dir
		clean: {
			main: ['build/<%= pkg.name %>']
		},

		// Copy the plugin to a versioned release directory
		copy: {
			main: {
				src:  [
					'**',
					'!.tx/**',
					'!.assets/**',
					'!.git/**',
					'!.gitignore',
					'!.gitmodules',
					'!.jshintrc',
					'!.scrutinizer.yml',
					'!node_modules/**',
					'!build/**',
					'!Gruntfile.js',
					'!package.json',
					'!package-lock.json',
					'!LICENSE',
					'!README.md',
					'!nbproject/**',
					'!**/*.LCK',
					'!**/_notes/**'
				],
				dest: 'build/<%= pkg.name %>/'
			}
		},

		// Convert line endings to LF
		lineending: {
			build: {
				options: {
					eol: 'lf',
					overwrite: true
				},
				files: [{
					expand: true,
					cwd: 'build/<%= pkg.name %>/',
					src: ['**/*.{php,css,js,po,txt}']
				}]
			}
		},

		// Create zip package
		compress: {
			main: {
				options: {
					mode: 'zip',
					archive: './build/<%= pkg.name %>.<%= pkg.version %>.zip'
				},
				expand: true,
				cwd: 'build/<%= pkg.name %>/',
				src: ['**/*'],
				dest: '<%= pkg.name %>/'
			}
		},

		// Generate .pot file
		makepot: {
			target: {
				options: {
					domainPath: '/languages',
					exclude: ['build/.*'],
					potFilename: 'wpmu-plugin-stats.pot',
					processPot: function( pot ) {
						pot.headers['report-msgid-bugs-to'] = 'https://github.com/WPStore/wpmu-plugin-stats/issues\n';
						pot.headers['plural-forms'] = 'nplurals=2; plural=n != 1;';
						pot.headers['last-translator'] = 'WPStore.io <code@wpstore.io>\n';
						pot.headers['language-team'] = 'WPStore.io <code@wpstore.io>\n';
						pot.headers['x-poedit-basepath'] = '.\n';
						pot.headers['x-poedit-language'] = 'English\n';
						pot.headers['x-poedit-country'] = 'United States\n';
						pot.headers['x-poedit-sourcecharset'] = 'utf-8\n';
						pot.headers['x-poedit-keywordslist'] = '__;_e;__ngettext:1,2;_n:1,2;__ngettext_noop:1,2;_n_noop:1,2;_c,_nc:4c,1,2;_x:1,2c;_ex:1,2c;_nx:4c,1,2;_nx_noop:4c,1,2;\n';
						pot.headers['x-poedit-bookmarks'] = '\n';
						pot.headers['x-poedit-searchpath-0'] = '.\n';
						pot.headers['x-textdomain-support'] = 'yes\n';
						// Exclude string without textdomain and plugin's meta data
						var translation, delete_translation,
							excluded_strings = [ 'Yes', 'No' ],
							excluded_meta = [ 'Plugin Name of the plugin/theme', 'Author of the plugin/theme', 'Author URI of the plugin/theme' ];
						for ( translation in pot.translations[''] ) {
							delete_translation = false;
							if ( excluded_strings.indexOf( translation ) >= 0 ) {
								delete_translation = true;
								console.log( 'Excluded string: ' + translation );
							}
							if ( typeof pot.translations[''][translation].comments.extracted !== 'undefined' ) {
								if ( excluded_meta.indexOf( pot.translations[''][translation].comments.extracted ) >= 0 ) {
									delete_translation = true;
									console.log( 'Excluded meta: ' + pot.translations[''][translation].comments.extracted );
								}
							}
							if ( delete_translation ) {
								delete pot.translations[''][translation];
							}
						}
						return pot;
					},
					type: 'wp-plugin',
					updateTimestamp: true
				}
			}
		},

		// Check plugin text domain
		checktextdomain: {
			options:{
				text_domain: 'wpmu-plugin-stats',
				keywords: [
					'__:1,2d',
					'_e:1,2d',
					'_x:1,2c,3d',
					'esc_html__:1,2d',
					'esc_html_e:1,2d',
					'esc_html_x:1,2c,3d',
					'esc_attr__:1,2d',
					'esc_attr_e:1,2d',
					'esc_attr_x:1,2c,3d',
					'_ex:1,2c,3d',
					'_n:1,2,4d',
					'_nx:1,2,4c,5d',
					'_n_noop:1,2,3d',
					'_nx_noop:1,2,3c,4d'
				],
				report_missing: true
			},
			files: {
				src:  [
					'**/*.php',
					'!node_modules/**',
					'!build/**'
				],
				expand: true
			}
		},

		// Generate .mo files from .po files
		potomo: {
			dist: {
				options: {
					poDel: false
				},
				files: [{
					expand: true,
					cwd: 'languages',
					src: ['*.po'],
					dest: 'languages',
					ext: '.mo',
					nonull: true
				}]
			}
		},

		// Generate README.md from readme.txt
		wp_readme_to_markdown: {
			readme: {
				files: {
					'README.md': 'readme.txt'
				},
				options: {
					screenshot_url: 'https://raw.githubusercontent.com/wpstore/{plugin}/develop/.assets/{screenshot}.png'
				}
			}
		},

		// Check version
		checkwpversion: {
			options:{
				readme: 'readme.txt',
				plugin: 'wpmu-plugin-stats.php'
			},
			plugin_vs_readme: { // Check plugin header version againts stable tag in readme
				version1: 'plugin',
				version2: 'readme',
				compare: '=='
			},
			plugin_vs_grunt: { // Check plugin header version against package.json version
				version1: 'plugin',
				version2: '<%= pkg.version %>',
				compare: '=='
			},
			plugin_vs_internal: { // Check plugin header version against internal defined version
				version1: 'plugin',
				version2: grunt.file.read('wpmu-plugin-stats.php').match( /version = '(.*)'/ )[1],
				compare: '=='
			}
		},

		// Transifex integration
		exec: {
			txpull: { // Pull Transifex translation - grunt exec:txpull
				cmd: 'tx pull -a --minimum-perc=90'
			},
			txpush: { // Push pot to Transifex - grunt exec:txpush
				cmd: 'tx push -s'
			}
		},

		// Deploy to WP repository
		wp_deploy: {
			deploy: {
				options: {
					plugin_slug: '<%= pkg.name %>',
					build_dir: 'build/<%= pkg.name %>',
					assets_dir: '.assets'
				}
			}
		}

	});

	// Load NPM tasks to be used here
	require( 'load-grunt-tasks' )( grunt );

	grunt.registerTask( 'languages', [
		'checktextdomain',
		'makepot',
		'exec:txpush',
		'exec:txpull',
		'potomo'
	]);

	grunt.registerTask( 'readme', [
		'wp_readme_to_markdown'
	]);

	grunt.registerTask( 'build', [
		'checkwpversion',
		'checktextdomain',
		'readme',
		'clean',
		'copy',
		'lineending',
		'compress'
	]);

	grunt.registerTask( 'deploy', [
		'build',
		'wp_deploy'
	]);

};