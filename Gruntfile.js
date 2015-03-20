module.exports = function(grunt) {

    grunt.initConfig({
        less: {
            development: {
                files: {
                    "css/style.css": "less/*.less"
                }
            },
        },
        watch: {
            files: ['less/*.less'],
            tasks: ['less']
        }
    });

    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['watch']);

};
